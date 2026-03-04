import type {
  CreateBanEntryPayload,
  CreateDraftPlanPayload,
  CreatePreferredEntryPayload,
  DraftPlanDetails,
  DraftPlanSummary,
  UpdateBanEntryPayload,
  UpdatePreferredEntryPayload,
} from '@draft-plans/shared';
import { apiRequest } from '@/lib/api/client';

export const draftPlanQueryKeys = {
  all: ['draft-plans'] as const,
  details: (draftPlanId: string) => ['draft-plans', draftPlanId] as const,
};

export function listDraftPlans() {
  return apiRequest<DraftPlanSummary[]>('/draft-plans');
}

export function getDraftPlan(draftPlanId: string) {
  return apiRequest<DraftPlanDetails>(`/draft-plans/${draftPlanId}`);
}

export function createDraftPlan(payload: CreateDraftPlanPayload) {
  return apiRequest<DraftPlanDetails>('/draft-plans', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function addBanEntry(draftPlanId: string, payload: CreateBanEntryPayload) {
  return apiRequest<DraftPlanDetails>(`/draft-plans/${draftPlanId}/bans`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateBanEntry(
  draftPlanId: string,
  entryId: string,
  payload: UpdateBanEntryPayload,
) {
  return apiRequest<DraftPlanDetails>(`/draft-plans/${draftPlanId}/bans/${entryId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteBanEntry(draftPlanId: string, entryId: string) {
  return apiRequest<DraftPlanDetails>(`/draft-plans/${draftPlanId}/bans/${entryId}`, {
    method: 'DELETE',
  });
}

export function addPreferredEntry(
  draftPlanId: string,
  payload: CreatePreferredEntryPayload,
) {
  return apiRequest<DraftPlanDetails>(`/draft-plans/${draftPlanId}/preferred-picks`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updatePreferredEntry(
  draftPlanId: string,
  entryId: string,
  payload: UpdatePreferredEntryPayload,
) {
  return apiRequest<DraftPlanDetails>(
    `/draft-plans/${draftPlanId}/preferred-picks/${entryId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );
}

export function deletePreferredEntry(draftPlanId: string, entryId: string) {
  return apiRequest<DraftPlanDetails>(
    `/draft-plans/${draftPlanId}/preferred-picks/${entryId}`,
    {
      method: 'DELETE',
    },
  );
}
