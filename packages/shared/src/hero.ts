export type HeroRecord = {
  id: number;
  name: string;
  localizedName: string;
  primaryAttr: string | null;
  attackType: string | null;
  roles: string[];
  imageUrl: string | null;
  iconUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type HeroCacheFreshness = 'EMPTY' | 'FRESH' | 'STALE';
export type BackgroundJobStatus = 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
export type BackgroundJobType = 'HERO_SYNC';

export type HeroCacheRecord = {
  cacheKey: string;
  freshness: HeroCacheFreshness;
  heroCount: number;
  lastSyncedAt: string | null;
  lastExternalRequestAt: string | null;
  expiresAt: string | null;
  lastError: string | null;
  activeJobId: string | null;
};

export type HeroSyncResult = {
  syncedCount: number;
  syncedAt: string;
  cacheExpiresAt: string;
  cacheKey: string;
};

export type BackgroundJobRecord = {
  id: string;
  type: BackgroundJobType;
  status: BackgroundJobStatus;
  dedupeKey: string | null;
  progress: number;
  progressMessage: string | null;
  attempts: number;
  availableAt: string;
  startedAt: string | null;
  completedAt: string | null;
  lockedAt: string | null;
  workerId: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

export type QueueHeroSyncJobResult = {
  created: boolean;
  job: BackgroundJobRecord;
  cache: HeroCacheRecord;
};

export type HeroSyncJobStatusResponse = {
  job: BackgroundJobRecord;
  cache: HeroCacheRecord;
};
