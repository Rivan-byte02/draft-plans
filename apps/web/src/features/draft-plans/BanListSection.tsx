import { useEffect, useState } from 'react';
import type { DraftPlanBanEntry } from '@draft-plans/shared';
import { EmptyState } from '@/components/EmptyState';
import { BanIcon, PlusIcon } from '@/components/Icons';
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

  useEffect(() => {
    setNoteByEntryId(
      Object.fromEntries(entries.map((entry) => [entry.id, entry.note ?? ''])),
    );
  }, [entries]);

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
              className="strategy-entry-card"
              data-testid={`ban-entry-${entry.id}`}
              key={entry.id}
            >
              <div className="strategy-entry-top">
                <div className="strategy-entry-hero">
                  <div className="strategy-entry-thumb">
                    {getHeroAssetUrl(entry.heroImageUrl) ? (
                      <img alt={entry.heroName} src={getHeroAssetUrl(entry.heroImageUrl) ?? undefined} />
                    ) : (
                      <span>{entry.heroName.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <h3>{entry.heroName}</h3>
                    <p>Hero ID: {entry.heroId}</p>
                  </div>
                </div>
                <span className="entry-chip entry-chip-ban">Ban</span>
              </div>
              <label className="field">
                <span>Note</span>
                <textarea
                  rows={3}
                  value={noteByEntryId[entry.id] ?? ''}
                  onChange={(event) =>
                    setNoteByEntryId((currentState) => ({
                      ...currentState,
                      [entry.id]: event.target.value,
                    }))
                  }
                />
              </label>
              <div className="strategy-entry-actions">
                <button
                  className="secondary-button"
                  disabled={isSaving}
                  onClick={() => onSaveEntry(entry.id, noteByEntryId[entry.id] ?? '')}
                  type="button"
                >
                  Save Note
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
          ))}
        </div>
      )}
    </section>
  );
}
