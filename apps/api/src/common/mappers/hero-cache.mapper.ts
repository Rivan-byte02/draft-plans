import type { HeroCacheFreshness, HeroCacheRecord } from '@draft-plans/shared';
import type { HeroCacheState } from '@prisma/client';

export function toHeroCacheRecord(
  heroCacheState: HeroCacheState | null,
  activeJobId: string | null,
): HeroCacheRecord {
  const freshness = resolveHeroCacheFreshness(heroCacheState);

  return {
    cacheKey: heroCacheState?.key ?? 'open-dota-heroes',
    freshness,
    heroCount: heroCacheState?.heroCount ?? 0,
    lastSyncedAt: heroCacheState?.lastSyncedAt?.toISOString() ?? null,
    lastExternalRequestAt: heroCacheState?.lastExternalRequestAt?.toISOString() ?? null,
    expiresAt: heroCacheState?.expiresAt?.toISOString() ?? null,
    lastError: heroCacheState?.lastError ?? null,
    activeJobId,
  };
}

export function resolveHeroCacheFreshness(
  heroCacheState: Pick<HeroCacheState, 'heroCount' | 'expiresAt'> | null,
  now = new Date(),
): HeroCacheFreshness {
  if (!heroCacheState || heroCacheState.heroCount === 0) {
    return 'EMPTY';
  }

  if (heroCacheState.expiresAt && heroCacheState.expiresAt > now) {
    return 'FRESH';
  }

  return 'STALE';
}
