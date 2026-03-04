import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import type { DraftPlanDetails } from '@draft-plans/shared';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CreateDraftPlanForm } from './CreateDraftPlanForm';
import {
  createDraftPlan,
  draftPlanQueryKeys,
  getDraftPlan,
  listDraftPlans,
} from './draft-plan.api';
import { EmptyState } from '@/components/EmptyState';
import { BanIcon, ClockIcon, PlusIcon, ShieldIcon, StarIcon } from '@/components/Icons';
import { getHeroAssetUrl } from '@/lib/utils/hero-asset-url';
import { formatRelativeTime } from '@/lib/utils/time';

export function DraftPlansPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const draftPlansQuery = useQuery({
    queryKey: draftPlanQueryKeys.all,
    queryFn: listDraftPlans,
  });

  const draftPlanDetailQueries = useQueries({
    queries: (draftPlansQuery.data ?? []).map((draftPlan) => ({
      queryKey: draftPlanQueryKeys.details(draftPlan.id),
      queryFn: () => getDraftPlan(draftPlan.id),
      staleTime: 30_000,
    })),
  });

  const createDraftPlanMutation = useMutation({
    mutationFn: createDraftPlan,
    onSuccess: async (draftPlan) => {
      await queryClient.invalidateQueries({ queryKey: draftPlanQueryKeys.all });
      await queryClient.invalidateQueries({
        queryKey: draftPlanQueryKeys.details(draftPlan.id),
      });
      navigate(`/draft-plans/${draftPlan.id}`);
    },
  });

  const detailById = useMemo(() => {
    return new Map<string, DraftPlanDetails>(
      draftPlanDetailQueries
        .map((query) => query.data)
        .filter((draftPlan): draftPlan is DraftPlanDetails => Boolean(draftPlan))
        .map((draftPlan) => [draftPlan.id, draftPlan]),
    );
  }, [draftPlanDetailQueries]);

  return (
    <>
      <CreateDraftPlanForm
        isOpen={isCreateModalOpen}
        isSubmitting={createDraftPlanMutation.isPending}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={(payload) => createDraftPlanMutation.mutateAsync(payload)}
      />

      <section className="overview-page">
        <div className="overview-header">
          <div>
            <h1>Draft Plans</h1>
            <p className="overview-subtitle">
              {draftPlansQuery.data?.length ?? 0}
              {' '}
              plans
            </p>
          </div>
          <button
            className="primary-button overview-create-button"
            data-testid="open-create-draft-plan-button"
            onClick={() => setIsCreateModalOpen(true)}
            type="button"
          >
            <PlusIcon />
            <span>New Draft Plan</span>
          </button>
        </div>

        {draftPlansQuery.isLoading ? <p>Loading draft plans...</p> : null}
        {draftPlansQuery.isError ? (
          <p className="error-text">
            Failed to load draft plans. Refresh and verify the API is running.
          </p>
        ) : null}

        {!draftPlansQuery.isLoading && !draftPlansQuery.data?.length ? (
          <EmptyState
            title="No Draft Plans"
            description="Create your first draft plan to start organizing bans and preferred picks."
            icon={<ShieldIcon />}
          />
        ) : null}

        <div className="overview-grid">
          {draftPlansQuery.data?.map((draftPlan) => {
            const draftPlanDetails = detailById.get(draftPlan.id);
            const previewEntries = [
              ...(draftPlanDetails?.banList ?? []),
              ...(draftPlanDetails?.preferredPicks ?? []),
            ];
            const hiddenPreviewEntryCount = Math.max(previewEntries.length - 4, 0);
            const visiblePreviewEntries = previewEntries.slice(
              0,
              hiddenPreviewEntryCount > 0 ? 3 : 4,
            );

            return (
              <Link
                key={draftPlan.id}
                className="draft-plan-overview-card"
                data-testid={`draft-plan-card-${draftPlan.id}`}
                to={`/draft-plans/${draftPlan.id}`}
              >
                <div className="draft-plan-card-header">
                  <div>
                    <h3>{draftPlan.name}</h3>
                    <p title={draftPlan.description || 'No description provided.'}>
                      {draftPlan.description || 'No description provided.'}
                    </p>
                  </div>
                </div>

                {previewEntries.length ? (
                  <div className="draft-plan-preview-row">
                    {visiblePreviewEntries.map((entry) => {
                      const heroImageUrl = getHeroAssetUrl(entry.heroImageUrl);

                      return (
                        <div className="hero-thumb" key={entry.id}>
                          {heroImageUrl ? (
                            <img alt={entry.heroName} src={heroImageUrl} />
                          ) : (
                            <span>{entry.heroName.charAt(0)}</span>
                          )}
                        </div>
                      );
                    })}
                    {hiddenPreviewEntryCount > 0 ? (
                      <div
                        className="hero-thumb hero-thumb-overflow"
                        title={`${hiddenPreviewEntryCount} more heroes`}
                      >
                        <span>+{hiddenPreviewEntryCount}</span>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="draft-plan-preview-row draft-plan-preview-placeholder">
                    <span>No heroes added yet</span>
                  </div>
                )}

                <div className="draft-plan-card-footer">
                  <div className="plan-stat-group">
                    <span className="plan-stat plan-stat-ban">
                      <BanIcon />
                      <span>{draftPlan.banCount} bans</span>
                    </span>
                    <span className="plan-stat plan-stat-pick">
                      <StarIcon />
                      <span>{draftPlan.preferredPickCount} picks</span>
                    </span>
                  </div>
                  <span className="plan-time">
                    <ClockIcon />
                    <span>{formatRelativeTime(draftPlan.updatedAt)}</span>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
