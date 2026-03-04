export const draftPlanPriorityOptions = ['HIGH', 'MEDIUM', 'LOW'] as const;
export type DraftPlanPriority = (typeof draftPlanPriorityOptions)[number];

export const draftPlanSectionOptions = ['BAN', 'PREFERRED'] as const;
export type DraftPlanSection = (typeof draftPlanSectionOptions)[number];

export type DraftPlanSummary = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  banCount: number;
  preferredPickCount: number;
};

export type DraftPlanEntryBase = {
  id: string;
  heroId: number;
  heroName: string;
  heroImageUrl: string | null;
  note: string | null;
};

export type DraftPlanBanEntry = DraftPlanEntryBase;

export type DraftPlanPreferredEntry = DraftPlanEntryBase & {
  role: string | null;
  priority: DraftPlanPriority | null;
};

export type DraftPlanDetails = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  banList: DraftPlanBanEntry[];
  preferredPicks: DraftPlanPreferredEntry[];
};

export type CreateDraftPlanPayload = {
  name: string;
  description?: string;
};

export type CreateBanEntryPayload = {
  heroId: number;
  note?: string;
};

export type UpdateBanEntryPayload = {
  note?: string;
};

export type CreatePreferredEntryPayload = {
  heroId: number;
  role?: string;
  priority: DraftPlanPriority;
  note?: string;
};

export type UpdatePreferredEntryPayload = {
  role?: string;
  priority?: DraftPlanPriority;
  note?: string;
};
