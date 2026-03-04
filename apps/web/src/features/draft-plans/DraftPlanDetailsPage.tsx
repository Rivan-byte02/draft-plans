import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreatePreferredEntryPayload,
  DraftPlanSection,
  DraftPlanPriority,
} from '@draft-plans/shared';
import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { EmptyState } from '@/components/EmptyState';
import { ShieldIcon } from '@/components/Icons';
import { HeroBrowserModal } from '@/features/heroes/HeroBrowserModal';
import { BanListSection } from './BanListSection';
import { PreferredPicksSection } from './PreferredPicksSection';
import {
  addBanEntry,
  addPreferredEntry,
  deleteBanEntry,
  deletePreferredEntry,
  draftPlanQueryKeys,
  getDraftPlan,
  updateBanEntry,
  updatePreferredEntry,
} from './draft-plan.api';

export function DraftPlanDetailsPage() {
  const { draftPlanId } = useParams<{ draftPlanId: string }>();
  const queryClient = useQueryClient();
  const [heroBrowserSection, setHeroBrowserSection] = useState<DraftPlanSection | null>(null);

  const draftPlanDetailsQuery = useQuery({
    queryKey: draftPlanQueryKeys.details(draftPlanId ?? ''),
    queryFn: () => getDraftPlan(draftPlanId ?? ''),
    enabled: Boolean(draftPlanId),
  });

  const invalidateDraftPlanQueries = async (nextDraftPlanId: string) => {
    await queryClient.invalidateQueries({ queryKey: draftPlanQueryKeys.all });
    await queryClient.invalidateQueries({
      queryKey: draftPlanQueryKeys.details(nextDraftPlanId),
    });
  };

  const addBanEntryMutation = useMutation({
    mutationFn: (heroId: number) => addBanEntry(draftPlanId ?? '', { heroId }),
    onSuccess: async () => {
      if (draftPlanId) {
        await invalidateDraftPlanQueries(draftPlanId);
      }
    },
  });

  const addPreferredEntryMutation = useMutation({
    mutationFn: (payload: CreatePreferredEntryPayload) =>
      addPreferredEntry(draftPlanId ?? '', payload),
    onSuccess: async () => {
      if (draftPlanId) {
        await invalidateDraftPlanQueries(draftPlanId);
      }
    },
  });

  const updateBanEntryMutation = useMutation({
    mutationFn: ({ entryId, note }: { entryId: string; note: string }) =>
      updateBanEntry(draftPlanId ?? '', entryId, { note }),
    onSuccess: async () => {
      if (draftPlanId) {
        await invalidateDraftPlanQueries(draftPlanId);
      }
    },
  });

  const deleteBanEntryMutation = useMutation({
    mutationFn: (entryId: string) => deleteBanEntry(draftPlanId ?? '', entryId),
    onSuccess: async () => {
      if (draftPlanId) {
        await invalidateDraftPlanQueries(draftPlanId);
      }
    },
  });

  const updatePreferredEntryMutation = useMutation({
    mutationFn: ({
      entryId,
      role,
      priority,
      note,
    }: {
      entryId: string;
      role: string;
      priority: DraftPlanPriority;
      note: string;
    }) =>
      updatePreferredEntry(draftPlanId ?? '', entryId, {
        role,
        priority,
        note,
      }),
    onSuccess: async () => {
      if (draftPlanId) {
        await invalidateDraftPlanQueries(draftPlanId);
      }
    },
  });

  const deletePreferredEntryMutation = useMutation({
    mutationFn: (entryId: string) => deletePreferredEntry(draftPlanId ?? '', entryId),
    onSuccess: async () => {
      if (draftPlanId) {
        await invalidateDraftPlanQueries(draftPlanId);
      }
    },
  });

  const isAnyMutationPending = useMemo(() => {
    return (
      addBanEntryMutation.isPending ||
      addPreferredEntryMutation.isPending ||
      updateBanEntryMutation.isPending ||
      deleteBanEntryMutation.isPending ||
      updatePreferredEntryMutation.isPending ||
      deletePreferredEntryMutation.isPending
    );
  }, [
    addBanEntryMutation.isPending,
    addPreferredEntryMutation.isPending,
    updateBanEntryMutation.isPending,
    deleteBanEntryMutation.isPending,
    updatePreferredEntryMutation.isPending,
    deletePreferredEntryMutation.isPending,
  ]);

  const selectedHeroesById = useMemo(() => {
    if (!draftPlanDetailsQuery.data) {
      return {};
    }

    return Object.fromEntries([
      ...draftPlanDetailsQuery.data.banList.map((entry) => [entry.heroId, 'BAN' as const]),
      ...draftPlanDetailsQuery.data.preferredPicks.map((entry) => [
        entry.heroId,
        'PREFERRED' as const,
      ]),
    ]);
  }, [draftPlanDetailsQuery.data]);

  if (!draftPlanId) {
    return (
      <div className="draft-page-shell">
        <EmptyState
          title="Draft Plan Not Found"
          description="Select a valid draft plan from the overview page."
          icon={<ShieldIcon />}
        />
      </div>
    );
  }

  return (
    <>
      <section className="draft-page-shell">
        <div className="draft-header-panel">
          {draftPlanDetailsQuery.isLoading ? <p>Loading draft plan...</p> : null}
          {draftPlanDetailsQuery.isError ? (
            <p className="error-text">
              Failed to load the selected draft plan. Verify the backend is running.
            </p>
          ) : null}

          {draftPlanDetailsQuery.data ? (
            <div className="draft-header-content">
              <ShieldIcon className="draft-header-icon" />
              <div>
                <h1>{draftPlanDetailsQuery.data.name}</h1>
                {draftPlanDetailsQuery.data.description ? (
                  <p className="draft-header-description">
                    {draftPlanDetailsQuery.data.description}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        {draftPlanDetailsQuery.data ? (
          <div className="draft-detail-columns">
            <BanListSection
              entries={draftPlanDetailsQuery.data.banList}
              isSaving={isAnyMutationPending}
              onDeleteEntry={(entryId) => deleteBanEntryMutation.mutateAsync(entryId)}
              onOpenHeroBrowser={() => setHeroBrowserSection('BAN')}
              onSaveEntry={(entryId, note) =>
                updateBanEntryMutation.mutateAsync({ entryId, note })
              }
            />
            <PreferredPicksSection
              entries={draftPlanDetailsQuery.data.preferredPicks}
              isSaving={isAnyMutationPending}
              onDeleteEntry={(entryId) =>
                deletePreferredEntryMutation.mutateAsync(entryId)
              }
              onOpenHeroBrowser={() => setHeroBrowserSection('PREFERRED')}
              onSaveEntry={(entryId, payload) =>
                updatePreferredEntryMutation.mutateAsync({
                  entryId,
                  role: payload.role,
                  priority: payload.priority,
                  note: payload.note,
                })
              }
            />
          </div>
        ) : null}
      </section>

      <HeroBrowserModal
        isOpen={heroBrowserSection !== null}
        preferredAction={heroBrowserSection}
        selectedHeroesById={selectedHeroesById}
        onClose={() => setHeroBrowserSection(null)}
        onBanHero={(hero) => addBanEntryMutation.mutateAsync(hero.id)}
        onPickHero={(hero) =>
          addPreferredEntryMutation.mutateAsync({
            heroId: hero.id,
            priority: 'MEDIUM',
            role: '',
            note: '',
          })
        }
      />
    </>
  );
}
