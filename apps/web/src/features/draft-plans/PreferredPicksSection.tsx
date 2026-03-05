import { useEffect, useState, type FocusEvent } from 'react';
import {
  draftPlanPriorityOptions,
  type DraftPlanPreferredEntry,
  type DraftPlanPriority,
} from '@draft-plans/shared';
import { EmptyState } from '@/components/EmptyState';
import { CloseIcon, PlusIcon, StarIcon } from '@/components/Icons';
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
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);

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

  function getEntryFormState(entry: DraftPlanPreferredEntry) {
    return formStateByEntryId[entry.id] ?? {
      role: entry.role ?? '',
      priority: entry.priority ?? 'MEDIUM',
      note: entry.note ?? '',
    };
  }

  function hasUnsavedChanges(entry: DraftPlanPreferredEntry) {
    const nextFormState = getEntryFormState(entry);

    return (
      nextFormState.role !== (entry.role ?? '') ||
      nextFormState.priority !== (entry.priority ?? 'MEDIUM') ||
      nextFormState.note !== (entry.note ?? '')
    );
  }

  async function handleSaveEntry(entry: DraftPlanPreferredEntry) {
    await onSaveEntry(entry.id, getEntryFormState(entry));
    setActiveEntryId((currentActiveEntryId) =>
      currentActiveEntryId === entry.id ? null : currentActiveEntryId,
    );
  }

  async function handleEntryClick(entry: DraftPlanPreferredEntry) {
    if (isSaving || activeEntryId === entry.id) {
      return;
    }

    const currentActiveEntry = entries.find(
      (currentEntry) => currentEntry.id === activeEntryId,
    );

    if (currentActiveEntry && hasUnsavedChanges(currentActiveEntry)) {
      await handleSaveEntry(currentActiveEntry);
    }

    setActiveEntryId(entry.id);
  }

  function handleEntryBlur(
    event: FocusEvent<HTMLElement>,
    entry: DraftPlanPreferredEntry,
  ) {
    if (
      !event.currentTarget.contains(event.relatedTarget as Node | null) &&
      !hasUnsavedChanges(entry)
    ) {
      setActiveEntryId((currentActiveEntryId) =>
        currentActiveEntryId === entry.id ? null : currentActiveEntryId,
      );
    }
  }

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
            const currentFormState = getEntryFormState(entry);

            return (
              <article
                className={`strategy-entry-card preferred-entry-card ${
                  activeEntryId === entry.id ? 'is-active' : ''
                }`}
                data-testid={`preferred-entry-${entry.id}`}
                key={entry.id}
                onBlur={(event) => handleEntryBlur(event, entry)}
                onClick={() => void handleEntryClick(entry)}
                tabIndex={0}
              >
                <div className="compact-entry-main preferred-entry-main">
                  <div className="strategy-entry-thumb compact-entry-thumb">
                    {getHeroAssetUrl(entry.heroImageUrl) ? (
                      <img
                        alt={entry.heroName}
                        src={getHeroAssetUrl(entry.heroImageUrl) ?? undefined}
                      />
                    ) : (
                      <span>{entry.heroName.charAt(0)}</span>
                    )}
                  </div>
                  <div className="compact-entry-content">
                    <div className="compact-entry-title-row">
                      <h3>{entry.heroName}</h3>
                      <div className="compact-entry-actions">
                        {activeEntryId === entry.id && hasUnsavedChanges(entry) ? (
                          <button
                            className="entry-save-button"
                            data-testid="preferred-entry-save-button"
                            disabled={isSaving}
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              void handleSaveEntry(entry);
                            }}
                            type="button"
                          >
                            Save
                          </button>
                        ) : null}
                        <button
                          aria-label={`Remove ${entry.heroName} from preferred picks`}
                          className={`entry-close-button ${
                            activeEntryId === entry.id ? 'is-visible' : ''
                          }`}
                          disabled={isSaving}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            void onDeleteEntry(entry.id);
                          }}
                          type="button"
                        >
                          <CloseIcon />
                        </button>
                      </div>
                    </div>
                    <div className="preferred-entry-field-row">
                      <input
                        data-testid="preferred-entry-role-input"
                        className="compact-entry-input compact-role-input"
                        placeholder="Role"
                        readOnly={activeEntryId !== entry.id || isSaving}
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
                      <select
                        data-testid="preferred-entry-priority-select"
                        className={`compact-entry-input compact-priority-select priority-${currentFormState.priority.toLowerCase()}`}
                        disabled={activeEntryId !== entry.id || isSaving}
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
                            {priority.charAt(0)}{priority.slice(1).toLowerCase()}
                          </option>
                        ))}
                      </select>
                    </div>
                    <input
                      data-testid="preferred-entry-note-input"
                      className="compact-entry-input preferred-note-input"
                      placeholder="Add note..."
                      readOnly={activeEntryId !== entry.id || isSaving}
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
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
