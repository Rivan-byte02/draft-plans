import type {
  DraftPlanBanEntry,
  DraftPlanDetails,
  DraftPlanPreferredEntry,
  DraftPlanSummary,
} from '@draft-plans/shared';
import { DraftPlanEntryType, type DraftPlan, type DraftPlanHeroEntry, type Hero } from '@prisma/client';

type DraftPlanWithEntries = DraftPlan & {
  entries: Array<DraftPlanHeroEntry & { hero: Hero }>;
};

type DraftPlanWithEntryTypes = DraftPlan & {
  entries: Array<Pick<DraftPlanHeroEntry, 'type'>>;
};

export function toDraftPlanSummary(plan: DraftPlanWithEntryTypes): DraftPlanSummary {
  const banCount = plan.entries.filter((entry) => entry.type === DraftPlanEntryType.BAN).length;
  const preferredPickCount = plan.entries.filter(
    (entry) => entry.type === DraftPlanEntryType.PREFERRED,
  ).length;

  return {
    id: plan.id,
    name: plan.name,
    description: plan.description,
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
    banCount,
    preferredPickCount,
  };
}

export function toDraftPlanDetails(plan: DraftPlanWithEntries): DraftPlanDetails {
  const banList: DraftPlanBanEntry[] = plan.entries
    .filter((entry) => entry.type === DraftPlanEntryType.BAN)
    .map((entry) => ({
      id: entry.id,
      heroId: entry.heroId,
      heroName: entry.hero.localizedName,
      heroImageUrl: entry.hero.imageUrl,
      note: entry.note,
    }));

  const preferredPicks: DraftPlanPreferredEntry[] = plan.entries
    .filter((entry) => entry.type === DraftPlanEntryType.PREFERRED)
    .map((entry) => ({
      id: entry.id,
      heroId: entry.heroId,
      heroName: entry.hero.localizedName,
      heroImageUrl: entry.hero.imageUrl,
      role: entry.role,
      priority: entry.priority,
      note: entry.note,
    }));

  return {
    id: plan.id,
    name: plan.name,
    description: plan.description,
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
    banList,
    preferredPicks,
  };
}
