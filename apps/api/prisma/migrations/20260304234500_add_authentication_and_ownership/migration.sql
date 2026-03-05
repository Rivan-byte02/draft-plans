CREATE TABLE "users" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "password_hash" TEXT NOT NULL,
  "deleted_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key"
ON "users"("email");

CREATE INDEX "users_deleted_at_created_at_idx"
ON "users"("deleted_at", "created_at");

INSERT INTO "users" ("id", "email", "name", "password_hash")
VALUES (
  'seed-user-local',
  'demo@draftplans.dev',
  'Demo User',
  'legacy-seed-password-hash'
)
ON CONFLICT ("email") DO NOTHING;

ALTER TABLE "draft_plans"
ADD COLUMN "owner_id" TEXT;

UPDATE "draft_plans"
SET "owner_id" = (
  SELECT "id"
  FROM "users"
  WHERE "email" = 'demo@draftplans.dev'
  LIMIT 1
)
WHERE "owner_id" IS NULL;

ALTER TABLE "draft_plans"
ALTER COLUMN "owner_id" SET NOT NULL;

DROP INDEX IF EXISTS "draft_plans_deleted_at_updated_at_idx";

CREATE INDEX "draft_plans_owner_id_deleted_at_updated_at_idx"
ON "draft_plans"("owner_id", "deleted_at", "updated_at");

ALTER TABLE "draft_plans"
ADD CONSTRAINT "draft_plans_owner_id_fkey"
FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
