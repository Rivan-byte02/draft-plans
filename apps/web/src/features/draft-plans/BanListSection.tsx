import { useEffect, useState, type FocusEvent } from 'react';
import type { DraftPlanBanEntry } from '@draft-plans/shared';
import { EmptyState } from '@/components/EmptyState';
import { BanIcon, CloseIcon, PlusIcon } from '@/components/Icons';
import { getHeroAssetUrl } from '@/lib/utils/hero-asset-url';

type BanListSectionProps = {
  entries: DraftPlanBanEntry[];
  isSaving: boolean;
  onOpenHeroBrowser: () => void;
  onSaveEntry: (entryId: string, note: string) => Promise<unknown> | void;
  onDeleteEntry: (entryId: string) => Promise<unknown> | void;
};

export function BanListSection({
  entries,
  isSaving,
  onOpenHeroBrowser,
  onSaveEntry,
  onDeleteEntry,
}: BanListSectionProps) {
  const [noteByEntryId, setNoteByEntryId] = useState<Record<string, string>>({});
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);

  useEffect(() => {
    setNoteByEntryId(
      Object.fromEntries(entries.map((entry) => [entry.id, entry.note ?? ''])),
    );
  }, [entries]);

  function hasUnsavedChanges(entry: DraftPlanBanEntry) {
    return (noteByEntryId[entry.id] ?? '') !== (entry.note ?? '');
  }

  async function handleSaveEntry(entry: DraftPlanBanEntry) {
    await onSaveEntry(entry.id, noteByEntryId[entry.id] ?? '');
    setActiveEntryId((currentActiveEntryId) =>
      currentActiveEntryId === entry.id ? null : currentActiveEntryId,
    );
  }

  async function handleEntryClick(entry: DraftPlanBanEntry) {
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

  function handleEntryBlur(event: FocusEvent<HTMLElement>, entry: DraftPlanBanEntry) {
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
    <section className="draft-section" data-testid="ban-list-section">
      <div className="draft-section-header">
        <div className="draft-section-title">
          <BanIcon className="section-icon ban" />
          <h2>Ban List</h2>
          <span className="section-count">({entries.length})</span>
        </div>
        <button
          className="section-action-button"
          data-testid="open-ban-hero-browser-button"
          onClick={onOpenHeroBrowser}
          type="button"
        >
          <PlusIcon />
          <span>Add Ban</span>
        </button>
      </div>

      {!entries.length ? (
        <EmptyState
          title="No Bans"
          description="Add heroes you want to ban from the draft."
          icon={<BanIcon />}
        />
      ) : (
        <div className="strategy-entry-grid">
          {entries.map((entry) => (
            <article
              className={`strategy-entry-card ban-entry-card ${
                activeEntryId === entry.id ? 'is-active' : ''
              }`}
              data-testid={`ban-entry-${entry.id}`}
              key={entry.id}
              onBlur={(event) => handleEntryBlur(event, entry)}
              onClick={() => void handleEntryClick(entry)}
              tabIndex={0}
            >
              <div className="compact-entry-main">
                <div className="strategy-entry-thumb compact-entry-thumb">
                  {getHeroAssetUrl(entry.heroImageUrl) ? (
                    <img alt={entry.heroName} src={getHeroAssetUrl(entry.heroImageUrl) ?? undefined} />
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
                          data-testid="ban-entry-save-button"
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
                        aria-label={`Remove ${entry.heroName} from ban list`}
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
                  <input
                    data-testid="ban-entry-note-input"
                    className="compact-entry-input ban-note-input"
                    placeholder="Add a ban note"
                    readOnly={activeEntryId !== entry.id || isSaving}
                    value={noteByEntryId[entry.id] ?? ''}
                    onChange={(event) =>
                      setNoteByEntryId((currentState) => ({
                        ...currentState,
                        [entry.id]: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
