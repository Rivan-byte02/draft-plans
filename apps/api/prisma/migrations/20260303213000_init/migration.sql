CREATE TYPE "DraftPlanEntryType" AS ENUM ('BAN', 'PREFERRED');
CREATE TYPE "DraftPlanPriority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

CREATE TABLE "draft_plans" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "draft_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "heroes" (
  "id" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "localized_name" TEXT NOT NULL,
  "primary_attr" TEXT,
  "attack_type" TEXT,
  "roles" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "image_url" TEXT,
  "icon_url" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "heroes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "draft_plan_hero_entries" (
  "id" TEXT NOT NULL,
  "draft_plan_id" TEXT NOT NULL,
  "hero_id" INTEGER NOT NULL,
  "type" "DraftPlanEntryType" NOT NULL,
  "role" TEXT,
  "priority" "DraftPlanPriority",
  "note" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "draft_plan_hero_entries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "draft_plan_hero_entries_draft_plan_id_hero_id_type_key"
ON "draft_plan_hero_entries"("draft_plan_id", "hero_id", "type");

CREATE INDEX "draft_plan_hero_entries_draft_plan_id_type_idx"
ON "draft_plan_hero_entries"("draft_plan_id", "type");

ALTER TABLE "draft_plan_hero_entries"
ADD CONSTRAINT "draft_plan_hero_entries_draft_plan_id_fkey"
FOREIGN KEY ("draft_plan_id") REFERENCES "draft_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "draft_plan_hero_entries"
ADD CONSTRAINT "draft_plan_hero_entries_hero_id_fkey"
FOREIGN KEY ("hero_id") REFERENCES "heroes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
