import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { BackgroundJobStatus, BackgroundJobType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type EnqueueJobInput = {
  type: BackgroundJobType;
  dedupeKey?: string;
  payload?: Prisma.InputJsonValue;
};

@Injectable()
export class BackgroundJobsService {
  constructor(private readonly prisma: PrismaService) {}

  async enqueueJob(input: EnqueueJobInput) {
    const existingJob = await this.findActiveJob(input.type, input.dedupeKey);
    if (existingJob) {
      return {
        created: false,
        job: existingJob,
      };
    }

    const createdJob = await this.prisma.backgroundJob.create({
      data: {
        type: input.type,
        dedupeKey: input.dedupeKey,
        payload: input.payload,
      },
    });

    return {
      created: true,
      job: createdJob,
    };
  }

  async findActiveJob(type: BackgroundJobType, dedupeKey?: string) {
    return this.prisma.backgroundJob.findFirst({
      where: {
        type,
        dedupeKey,
        status: {
          in: [BackgroundJobStatus.QUEUED, BackgroundJobStatus.RUNNING],
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async getJobOrThrow(jobId: string) {
    const backgroundJob = await this.prisma.backgroundJob.findUnique({
      where: { id: jobId },
    });

    if (!backgroundJob) {
      throw new NotFoundException('Background job not found');
    }

    return backgroundJob;
  }

  async claimNextJob(workerId: string) {
    const claimedJobs = await this.prisma.$queryRaw<
      Array<{
        id: string;
        type: BackgroundJobType;
        status: BackgroundJobStatus;
        dedupe_key: string | null;
        payload: Prisma.JsonValue | null;
        progress: number;
        progress_message: string | null;
        result: Prisma.JsonValue | null;
        attempts: number;
        available_at: Date;
        started_at: Date | null;
        completed_at: Date | null;
        locked_at: Date | null;
        worker_id: string | null;
        error_message: string | null;
        created_at: Date;
        updated_at: Date;
      }>
    >`
      WITH next_job AS (
        SELECT id
        FROM background_jobs
        WHERE status = CAST('QUEUED' AS "BackgroundJobStatus")
          AND available_at <= NOW()
        ORDER BY created_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      )
      UPDATE background_jobs
      SET
        status = CAST('RUNNING' AS "BackgroundJobStatus"),
        started_at = COALESCE(started_at, NOW()),
        locked_at = NOW(),
        worker_id = ${workerId},
        attempts = attempts + 1,
        updated_at = NOW()
      WHERE id IN (SELECT id FROM next_job)
      RETURNING
        id,
        type,
        status,
        dedupe_key,
        payload,
        progress,
        progress_message,
        result,
        attempts,
        available_at,
        started_at,
        completed_at,
        locked_at,
        worker_id,
        error_message,
        created_at,
        updated_at;
    `;

    if (!claimedJobs.length) {
      return null;
    }

    const claimedJob = claimedJobs[0];
    return this.prisma.backgroundJob.findUnique({
      where: { id: claimedJob.id },
    });
  }

  async updateProgress(jobId: string, progress: number, progressMessage: string) {
    return this.prisma.backgroundJob.update({
      where: { id: jobId },
      data: {
        progress,
        progressMessage,
        lockedAt: new Date(),
      },
    });
  }

  async markSucceeded(jobId: string, result: Prisma.InputJsonValue) {
    return this.prisma.backgroundJob.update({
      where: { id: jobId },
      data: {
        status: BackgroundJobStatus.SUCCEEDED,
        progress: 100,
        result,
        completedAt: new Date(),
        errorMessage: null,
        lockedAt: null,
        workerId: null,
      },
    });
  }

  async markFailed(jobId: string, errorMessage: string) {
    return this.prisma.backgroundJob.update({
      where: { id: jobId },
      data: {
        status: BackgroundJobStatus.FAILED,
        errorMessage,
        completedAt: new Date(),
        lockedAt: null,
        workerId: null,
      },
    });
  }
}
