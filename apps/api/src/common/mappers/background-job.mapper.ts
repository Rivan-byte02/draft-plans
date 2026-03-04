import type { BackgroundJobRecord } from '@draft-plans/shared';
import type { BackgroundJob } from '@prisma/client';

export function toBackgroundJobRecord(backgroundJob: BackgroundJob): BackgroundJobRecord {
  return {
    id: backgroundJob.id,
    type: backgroundJob.type,
    status: backgroundJob.status,
    dedupeKey: backgroundJob.dedupeKey,
    progress: backgroundJob.progress,
    progressMessage: backgroundJob.progressMessage,
    attempts: backgroundJob.attempts,
    availableAt: backgroundJob.availableAt.toISOString(),
    startedAt: backgroundJob.startedAt?.toISOString() ?? null,
    completedAt: backgroundJob.completedAt?.toISOString() ?? null,
    lockedAt: backgroundJob.lockedAt?.toISOString() ?? null,
    workerId: backgroundJob.workerId,
    errorMessage: backgroundJob.errorMessage,
    createdAt: backgroundJob.createdAt.toISOString(),
    updatedAt: backgroundJob.updatedAt.toISOString(),
  };
}
