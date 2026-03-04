ALTER TABLE "draft_plans"
ADD COLUMN "deleted_at" TIMESTAMP(3);

ALTER TABLE "draft_plan_hero_entries"
ADD COLUMN "deleted_at" TIMESTAMP(3);

DROP INDEX IF EXISTS "draft_plan_hero_entries_draft_plan_id_hero_id_type_key";

CREATE INDEX "draft_plans_deleted_at_updated_at_idx"
ON "draft_plans"("deleted_at", "updated_at");

CREATE INDEX "draft_plan_hero_entries_draft_plan_id_type_deleted_at_idx"
ON "draft_plan_hero_entries"("draft_plan_id", "type", "deleted_at");

CREATE UNIQUE INDEX "draft_plan_hero_entries_active_section_key"
ON "draft_plan_hero_entries"("draft_plan_id", "hero_id", "type")
WHERE "deleted_at" IS NULL;

