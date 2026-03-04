import type {
  HeroRecord,
  HeroSyncJobStatusResponse,
  HeroCacheRecord,
  HeroSyncResult,
  QueueHeroSyncJobResult,
} from '@draft-plans/shared';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BackgroundJobType } from '@prisma/client';
import { BackgroundJobsService } from '../background-jobs/background-jobs.service';
import { toBackgroundJobRecord } from '../common/mappers/background-job.mapper';
import {
  resolveHeroCacheFreshness,
  toHeroCacheRecord,
} from '../common/mappers/hero-cache.mapper';
import { toHeroResponse } from '../common/mappers/hero.mapper';
import { OpenDotaHeroRecord } from '../common/types/open-dota-hero.type';
import { PrismaService } from '../prisma/prisma.service';

const heroCacheKey = 'open-dota-heroes';
const heroSyncDedupeKey = 'hero-catalog-sync';

@Injectable()
export class HeroesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly backgroundJobsService: BackgroundJobsService,
  ) {}

  async listHeroes(refresh = false): Promise<HeroRecord[]> {
    const existingHeroCount = await this.prisma.hero.count();

    if (refresh || existingHeroCount === 0) {
      await this.syncHeroesNow();
      return this.loadHeroesFromDatabase();
    }

    const heroCacheState = await this.prisma.heroCacheState.findUnique({
      where: { key: heroCacheKey },
    });

    if (resolveHeroCacheFreshness(heroCacheState) !== 'FRESH') {
      await this.queueHeroSyncJob();
    }

    return this.loadHeroesFromDatabase();
  }

  async getHeroCache(): Promise<HeroCacheRecord> {
    const [heroCacheState, activeSyncJob] = await Promise.all([
      this.prisma.heroCacheState.findUnique({
        where: { key: heroCacheKey },
      }),
      this.backgroundJobsService.findActiveJob(
        BackgroundJobType.HERO_SYNC,
        heroSyncDedupeKey,
      ),
    ]);

    return toHeroCacheRecord(heroCacheState, activeSyncJob?.id ?? null);
  }

  async syncHeroes(): Promise<HeroSyncResult> {
    return this.syncHeroesNow();
  }

  async queueHeroSyncJob(): Promise<QueueHeroSyncJobResult> {
    const queuedJobResult = await this.backgroundJobsService.enqueueJob({
      type: BackgroundJobType.HERO_SYNC,
      dedupeKey: heroSyncDedupeKey,
      payload: {
        cacheKey: heroCacheKey,
      },
    });

    await this.saveHeroCacheState({
      lastJobId: queuedJobResult.job.id,
    });

    return {
      created: queuedJobResult.created,
      job: toBackgroundJobRecord(queuedJobResult.job),
      cache: await this.getHeroCache(),
    };
  }

  async getHeroSyncJob(jobId: string): Promise<HeroSyncJobStatusResponse> {
    const backgroundJob = await this.backgroundJobsService.getJobOrThrow(jobId);

    return {
      job: toBackgroundJobRecord(backgroundJob),
      cache: await this.getHeroCache(),
    };
  }

  async processQueuedHeroSync(jobId: string) {
    await this.backgroundJobsService.updateProgress(
      jobId,
      5,
      'Fetching hero data from the OpenDota API',
    );

    const heroSyncResult = await this.syncHeroesNow({
      jobId,
      onProgress: async (progress, progressMessage) => {
        await this.backgroundJobsService.updateProgress(jobId, progress, progressMessage);
      },
    });

    await this.backgroundJobsService.markSucceeded(jobId, {
      cacheExpiresAt: heroSyncResult.cacheExpiresAt,
      cacheKey: heroSyncResult.cacheKey,
      syncedAt: heroSyncResult.syncedAt,
      syncedCount: heroSyncResult.syncedCount,
    });
  }

  private async loadHeroesFromDatabase() {
    const existingHeroCount = await this.prisma.hero.count();
    if (existingHeroCount === 0) {
      return [];
    }

    const heroes = await this.prisma.hero.findMany({
      orderBy: { localizedName: 'asc' },
    });

    return heroes.map(toHeroResponse);
  }

  private async syncHeroesNow(options?: {
    jobId?: string;
    onProgress?: (progress: number, progressMessage: string) => Promise<void>;
  }): Promise<HeroSyncResult> {
    const url =
      this.configService.get<string>('EXTERNAL_HEROES_URL') ??
      'https://api.opendota.com/api/heroStats';
    const externalRequestTimestamp = new Date();

    await this.saveHeroCacheState({
      lastExternalRequestAt: externalRequestTimestamp,
      lastJobId: options?.jobId ?? null,
      source: url,
    });

    const response = await fetch(url);
    if (!response.ok) {
      await this.saveHeroCacheState({
        lastError: 'Failed to load heroes from OpenDota',
        lastExternalRequestAt: externalRequestTimestamp,
        lastJobId: options?.jobId ?? null,
        source: url,
      });

      throw new ServiceUnavailableException('Failed to load heroes from OpenDota');
    }

    const heroes = (await response.json()) as OpenDotaHeroRecord[];
    const heroSyncBatchSize = Number(
      this.configService.get<string>('HERO_SYNC_BATCH_SIZE') ?? '25',
    );
    const heroSyncJobDelayMilliseconds = Number(
      this.configService.get<string>('HERO_SYNC_JOB_DELAY_MS') ?? '0',
    );

    for (let startIndex = 0; startIndex < heroes.length; startIndex += heroSyncBatchSize) {
      const heroBatch = heroes.slice(startIndex, startIndex + heroSyncBatchSize);

      await this.prisma.$transaction(
        heroBatch.map((hero) =>
          this.prisma.hero.upsert({
            where: { id: hero.id },
            update: {
              name: hero.name,
              localizedName: hero.localized_name,
              primaryAttr: hero.primary_attr,
              attackType: hero.attack_type,
              roles: hero.roles ?? [],
              imageUrl: hero.img,
              iconUrl: hero.icon,
            },
            create: {
              id: hero.id,
              name: hero.name,
              localizedName: hero.localized_name,
              primaryAttr: hero.primary_attr,
              attackType: hero.attack_type,
              roles: hero.roles ?? [],
              imageUrl: hero.img,
              iconUrl: hero.icon,
            },
          }),
        ),
      );

      if (options?.onProgress) {
        const processedHeroCount = Math.min(startIndex + heroBatch.length, heroes.length);
        const progress = Math.max(
          10,
          Math.min(95, Math.round((processedHeroCount / Math.max(heroes.length, 1)) * 100)),
        );

        await options.onProgress(
          progress,
          `Synced ${processedHeroCount} of ${heroes.length} heroes`,
        );
      }

      if (
        heroSyncJobDelayMilliseconds > 0 &&
        startIndex + heroBatch.length < heroes.length
      ) {
        await this.delay(heroSyncJobDelayMilliseconds);
      }
    }

    const totalCachedHeroCount = await this.prisma.hero.count();
    const syncedAt = new Date();
    const cacheExpiresAt = new Date(
      syncedAt.getTime() + this.getHeroCacheTtlMilliseconds(),
    );

    await this.saveHeroCacheState({
      expiresAt: cacheExpiresAt,
      heroCount: totalCachedHeroCount,
      lastError: null,
      lastExternalRequestAt: externalRequestTimestamp,
      lastJobId: options?.jobId ?? null,
      lastSyncedAt: syncedAt,
      source: url,
    });

    return {
      syncedCount: heroes.length,
      syncedAt: syncedAt.toISOString(),
      cacheExpiresAt: cacheExpiresAt.toISOString(),
      cacheKey: heroCacheKey,
    };
  }

  private async saveHeroCacheState(update: {
    expiresAt?: Date | null;
    heroCount?: number;
    lastError?: string | null;
    lastExternalRequestAt?: Date | null;
    lastJobId?: string | null;
    lastSyncedAt?: Date | null;
    source?: string | null;
  }) {
    return this.prisma.heroCacheState.upsert({
      where: { key: heroCacheKey },
      update,
      create: {
        key: heroCacheKey,
        expiresAt: update.expiresAt ?? null,
        heroCount: update.heroCount ?? 0,
        lastError: update.lastError ?? null,
        lastExternalRequestAt: update.lastExternalRequestAt ?? null,
        lastJobId: update.lastJobId ?? null,
        lastSyncedAt: update.lastSyncedAt ?? null,
        source: update.source ?? null,
      },
    });
  }

  private getHeroCacheTtlMilliseconds() {
    const configuredTtlSeconds = Number(
      this.configService.get<string>('HERO_CACHE_TTL_SECONDS') ?? '3600',
    );

    return configuredTtlSeconds * 1000;
  }

  private async delay(milliseconds: number) {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, milliseconds);
    });
  }
}
