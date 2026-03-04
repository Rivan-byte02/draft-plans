import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BackgroundJobType, type BackgroundJob } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { BackgroundJobsService } from '../background-jobs/background-jobs.service';
import { HeroesService } from './heroes.service';

@Injectable()
export class HeroSyncJobWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(HeroSyncJobWorkerService.name);
  private readonly workerId = `hero-sync-worker-${randomUUID()}`;
  private intervalHandle?: NodeJS.Timeout;
  private isPolling = false;

  constructor(
    private readonly backgroundJobsService: BackgroundJobsService,
    private readonly heroesService: HeroesService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    const workerEnabled =
      this.configService.get<string>('BACKGROUND_JOB_WORKER_ENABLED') !== 'false';

    if (!workerEnabled) {
      return;
    }

    const pollIntervalMilliseconds = Number(
      this.configService.get<string>('BACKGROUND_JOB_POLL_INTERVAL_MS') ?? '1000',
    );

    this.intervalHandle = setInterval(() => {
      void this.processAvailableJobs();
    }, pollIntervalMilliseconds);

    void this.processAvailableJobs();
  }

  onModuleDestroy() {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
    }
  }

  private async processAvailableJobs() {
    if (this.isPolling) {
      return;
    }

    this.isPolling = true;

    try {
      let backgroundJob = await this.backgroundJobsService.claimNextJob(this.workerId);

      while (backgroundJob) {
        await this.processJob(backgroundJob);
        backgroundJob = await this.backgroundJobsService.claimNextJob(this.workerId);
      }
    } finally {
      this.isPolling = false;
    }
  }

  private async processJob(backgroundJob: BackgroundJob) {
    try {
      if (backgroundJob.type === BackgroundJobType.HERO_SYNC) {
        await this.heroesService.processQueuedHeroSync(backgroundJob.id);
        return;
      }

      await this.backgroundJobsService.markFailed(
        backgroundJob.id,
        `Unsupported background job type: ${backgroundJob.type}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unexpected background job failure';

      this.logger.error(errorMessage);
      await this.backgroundJobsService.markFailed(backgroundJob.id, errorMessage);
    }
  }
}
