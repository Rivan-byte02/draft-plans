import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { DraftPlanSection, HeroRecord } from '@draft-plans/shared';
import {
  BanIcon,
  CloseIcon,
  SearchIcon,
  StarIcon,
} from '@/components/Icons';
import { getHeroAssetUrl } from '@/lib/utils/hero-asset-url';
import { heroQueryKeys, listHeroes, syncHeroes } from './hero.api';

type HeroAttributeFilter = 'ALL' | 'STR' | 'AGI' | 'INT' | 'UNI';

type HeroBrowserModalProps = {
  isOpen: boolean;
  preferredAction: DraftPlanSection | null;
  onClose: () => void;
  onBanHero: (hero: HeroRecord) => Promise<unknown> | void;
  onPickHero: (hero: HeroRecord) => Promise<unknown> | void;
};

const attributeFilterOptions: HeroAttributeFilter[] = ['ALL', 'STR', 'AGI', 'INT', 'UNI'];

function normalizeHeroAttribute(primaryAttribute: string | null) {
  if (primaryAttribute === 'str') {
    return 'STR';
  }

  if (primaryAttribute === 'agi') {
    return 'AGI';
  }

  if (primaryAttribute === 'int') {
    return 'INT';
  }

  return 'UNI';
}

export function HeroBrowserModal({
  isOpen,
  preferredAction,
  onClose,
  onBanHero,
  onPickHero,
}: HeroBrowserModalProps) {
  const queryClient = useQueryClient();
  const [searchValue, setSearchValue] = useState('');
  const [attributeFilter, setAttributeFilter] = useState<HeroAttributeFilter>('ALL');

  const heroesQuery = useQuery({
    queryKey: heroQueryKeys.all,
    queryFn: listHeroes,
    enabled: isOpen,
  });

  const syncHeroesMutation = useMutation({
    mutationFn: syncHeroes,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: heroQueryKeys.all });
    },
  });

  const filteredHeroes = useMemo(() => {
    const normalizedSearchValue = searchValue.trim().toLowerCase();

    return (heroesQuery.data ?? []).filter((hero) => {
      const matchesSearch =
        !normalizedSearchValue ||
        hero.localizedName.toLowerCase().includes(normalizedSearchValue) ||
        hero.roles.some((role) => role.toLowerCase().includes(normalizedSearchValue));

      const matchesAttribute =
        attributeFilter === 'ALL' ||
        normalizeHeroAttribute(hero.primaryAttr) === attributeFilter;

      return matchesSearch && matchesAttribute;
    });
  }, [attributeFilter, heroesQuery.data, searchValue]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <div
        aria-label="Hero browser"
        aria-modal="true"
        className="hero-browser-modal"
        data-testid="hero-browser-modal"
        role="dialog"
      >
        <div className="modal-top-row">
          <div>
            <h2>Hero Browser</h2>
          </div>
          <button
            aria-label="Close hero browser"
            className="icon-button"
            onClick={onClose}
            type="button"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="hero-browser-toolbar">
          <label className="hero-search-field">
            <SearchIcon />
            <input
              aria-label="Search heroes"
              data-testid="hero-search-input"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search heroes..."
            />
          </label>

          <div className="attribute-filter-row">
            {attributeFilterOptions.map((option) => (
              <button
                key={option}
                className={`attribute-filter-chip ${attributeFilter === option ? 'active' : ''}`}
                data-testid={`hero-attribute-filter-${option.toLowerCase()}`}
                onClick={() => setAttributeFilter(option)}
                type="button"
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="hero-browser-content">
          {heroesQuery.isLoading ? <p>Loading heroes...</p> : null}
          {heroesQuery.isError ? (
            <div className="hero-browser-status">
              <p className="error-text">Failed to load heroes from the API.</p>
              <button
                className="secondary-button"
                disabled={syncHeroesMutation.isPending}
                onClick={() => syncHeroesMutation.mutate()}
                type="button"
              >
                {syncHeroesMutation.isPending ? 'Syncing...' : 'Sync Heroes'}
              </button>
            </div>
          ) : null}

          <div className="hero-browser-grid">
            {filteredHeroes.map((hero) => {
              const heroImageUrl = getHeroAssetUrl(hero.imageUrl);
              const heroAttribute = normalizeHeroAttribute(hero.primaryAttr);

              return (
                <article
                  className="hero-browser-card"
                  data-testid={`hero-card-${hero.id}`}
                  key={hero.id}
                >
                  <div className="hero-browser-card-main">
                    <div className="hero-browser-thumb">
                      {heroImageUrl ? (
                        <img alt={hero.localizedName} src={heroImageUrl} />
                      ) : (
                        <span>{hero.localizedName.charAt(0)}</span>
                      )}
                    </div>
                    <div className="hero-browser-info">
                      <div className="hero-browser-name-row">
                        <h3>{hero.localizedName}</h3>
                        <span className={`hero-attribute hero-attribute-${heroAttribute.toLowerCase()}`}>
                          {heroAttribute}
                        </span>
                      </div>
                      <div className="hero-role-list">
                        {hero.roles.slice(0, 3).map((role) => (
                          <span className="hero-role-chip" key={role}>
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="hero-browser-card-actions">
                    <button
                      className={`hero-action-button hero-action-button-ban ${
                        preferredAction === 'BAN' ? 'recommended' : ''
                      }`}
                      data-testid={`ban-hero-${hero.id}`}
                      onClick={() => onBanHero(hero)}
                      type="button"
                    >
                      <BanIcon />
                      <span>Ban</span>
                    </button>
                    <button
                      className={`hero-action-button hero-action-button-pick ${
                        preferredAction === 'PREFERRED' ? 'recommended' : ''
                      }`}
                      data-testid={`pick-hero-${hero.id}`}
                      onClick={() => onPickHero(hero)}
                      type="button"
                    >
                      <StarIcon />
                      <span>Pick</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
