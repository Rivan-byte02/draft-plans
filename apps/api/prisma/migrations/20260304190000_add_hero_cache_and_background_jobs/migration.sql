CREATE TYPE "BackgroundJobType" AS ENUM ('HERO_SYNC');
CREATE TYPE "BackgroundJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED');

CREATE TABLE "hero_cache_states" (
  "key" TEXT NOT NULL,
  "last_external_request_at" TIMESTAMP(3),
  "last_synced_at" TIMESTAMP(3),
  "expires_at" TIMESTAMP(3),
  "hero_count" INTEGER NOT NULL DEFAULT 0,
  "source" TEXT,
  "last_error" TEXT,
  "last_job_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "hero_cache_states_pkey" PRIMARY KEY ("key")
);

CREATE TABLE "background_jobs" (
  "id" TEXT NOT NULL,
  "type" "BackgroundJobType" NOT NULL,
  "status" "BackgroundJobStatus" NOT NULL DEFAULT 'QUEUED',
  "dedupe_key" TEXT,
  "payload" JSONB,
  "progress" INTEGER NOT NULL DEFAULT 0,
  "progress_message" TEXT,
  "result" JSONB,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "available_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "started_at" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  "locked_at" TIMESTAMP(3),
  "worker_id" TEXT,
  "error_message" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "background_jobs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "background_jobs_status_available_at_created_at_idx"
ON "background_jobs"("status", "available_at", "created_at");

CREATE INDEX "background_jobs_type_status_created_at_idx"
ON "background_jobs"("type", "status", "created_at");

CREATE INDEX "background_jobs_dedupe_key_status_created_at_idx"
ON "background_jobs"("dedupe_key", "status", "created_at");
