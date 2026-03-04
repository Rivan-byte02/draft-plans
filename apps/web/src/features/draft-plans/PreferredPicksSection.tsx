import { useEffect, useState } from 'react';
import {
  draftPlanPriorityOptions,
  type DraftPlanPreferredEntry,
  type DraftPlanPriority,
} from '@draft-plans/shared';
import { EmptyState } from '@/components/EmptyState';
import { PlusIcon, StarIcon } from '@/components/Icons';
import { getHeroAssetUrl } from '@/lib/utils/hero-asset-url';

type PreferredPicksSectionProps = {
  entries: DraftPlanPreferredEntry[];
  isSaving: boolean;
  onOpenHeroBrowser: () => void;
  onSaveEntry: (
    entryId: string,
    payload: { role: string; priority: DraftPlanPriority; note: string },
  ) => Promise<unknown> | void;
  onDeleteEntry: (entryId: string) => Promise<unknown> | void;
};

type EntryFormState = {
  role: string;
  priority: DraftPlanPriority;
  note: string;
};

export function PreferredPicksSection({
  entries,
  isSaving,
  onOpenHeroBrowser,
  onSaveEntry,
  onDeleteEntry,
}: PreferredPicksSectionProps) {
  const [formStateByEntryId, setFormStateByEntryId] = useState<
    Record<string, EntryFormState>
  >({});

  useEffect(() => {
    setFormStateByEntryId(
      Object.fromEntries(
        entries.map((entry) => [
          entry.id,
          {
            role: entry.role ?? '',
            priority: entry.priority ?? 'MEDIUM',
            note: entry.note ?? '',
          },
        ]),
      ),
    );
  }, [entries]);

  return (
    <section className="draft-section" data-testid="preferred-picks-section">
      <div className="draft-section-header">
        <div className="draft-section-title">
          <StarIcon className="section-icon pick" />
          <h2>Preferred Picks</h2>
          <span className="section-count">({entries.length})</span>
        </div>
        <button
          className="section-action-button"
          data-testid="open-preferred-pick-hero-browser-button"
          onClick={onOpenHeroBrowser}
          type="button"
        >
          <PlusIcon />
          <span>Add Pick</span>
        </button>
      </div>

      {!entries.length ? (
        <EmptyState
          title="No Picks"
          description="Add heroes you want to prioritize in the draft."
          icon={<StarIcon />}
        />
      ) : (
        <div className="strategy-entry-grid">
          {entries.map((entry) => {
            const currentFormState = formStateByEntryId[entry.id] ?? {
              role: entry.role ?? '',
              priority: entry.priority ?? 'MEDIUM',
              note: entry.note ?? '',
            };

            return (
              <article
                className="strategy-entry-card"
                data-testid={`preferred-entry-${entry.id}`}
                key={entry.id}
              >
                <div className="strategy-entry-top">
                  <div className="strategy-entry-hero">
                    <div className="strategy-entry-thumb">
                      {getHeroAssetUrl(entry.heroImageUrl) ? (
                        <img
                          alt={entry.heroName}
                          src={getHeroAssetUrl(entry.heroImageUrl) ?? undefined}
                        />
                      ) : (
                        <span>{entry.heroName.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <h3>{entry.heroName}</h3>
                      <p>Hero ID: {entry.heroId}</p>
                    </div>
                  </div>
                  <span className="entry-chip entry-chip-pick">
                    {currentFormState.priority}
                  </span>
                </div>
                <div className="field-grid">
                  <label className="field">
                    <span>Role</span>
                    <input
                      value={currentFormState.role}
                      onChange={(event) =>
                        setFormStateByEntryId((currentState) => ({
                          ...currentState,
                          [entry.id]: {
                            ...currentFormState,
                            role: event.target.value,
                          },
                        }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Priority</span>
                    <select
                      value={currentFormState.priority}
                      onChange={(event) =>
                        setFormStateByEntryId((currentState) => ({
                          ...currentState,
                          [entry.id]: {
                            ...currentFormState,
                            priority: event.target.value as DraftPlanPriority,
                          },
                        }))
                      }
                    >
                      {draftPlanPriorityOptions.map((priority) => (
                        <option key={priority} value={priority}>
                          {priority}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="field">
                  <span>Note</span>
                  <textarea
                    rows={3}
                    value={currentFormState.note}
                    onChange={(event) =>
                      setFormStateByEntryId((currentState) => ({
                        ...currentState,
                        [entry.id]: {
                          ...currentFormState,
                          note: event.target.value,
                        },
                      }))
                    }
                  />
                </label>
                <div className="entry-actions">
                  <button
                    className="secondary-button"
                    disabled={isSaving}
                    onClick={() =>
                      onSaveEntry(entry.id, {
                        role: currentFormState.role,
                        priority: currentFormState.priority,
                        note: currentFormState.note,
                      })
                    }
                    type="button"
                  >
                    Save Changes
                  </button>
                  <button
                    className="danger-button"
                    disabled={isSaving}
                    onClick={() => onDeleteEntry(entry.id)}
                    type="button"
                  >
                    Remove
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
