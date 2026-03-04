import { expect, type Locator, type Page } from '@playwright/test';

type PreferredPickFormInput = {
  role: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  note: string;
};

export class DraftPlanDetailsPage {
  readonly page: Page;
  readonly heroBrowserModal: Locator;
  readonly banListSection: Locator;
  readonly preferredPicksSection: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heroBrowserModal = page.getByTestId('hero-browser-modal');
    this.banListSection = page.getByTestId('ban-list-section');
    this.preferredPicksSection = page.getByTestId('preferred-picks-section');
  }

  async expectLoaded(planName: string) {
    await expect(this.page.getByRole('heading', { name: planName, level: 1 })).toBeVisible();
    await expect(this.banListSection).toBeVisible();
    await expect(this.preferredPicksSection).toBeVisible();
  }

  banEntryByHeroName(heroName: string) {
    return this.page
      .locator('[data-testid^="ban-entry-"]')
      .filter({ hasText: heroName })
      .first();
  }

  preferredEntryByHeroName(heroName: string) {
    return this.page
      .locator('[data-testid^="preferred-entry-"]')
      .filter({ hasText: heroName })
      .first();
  }

  heroCardByName(heroName: string) {
    return this.page
      .locator('[data-testid^="hero-card-"]')
      .filter({ hasText: heroName })
      .first();
  }

  async addBan(heroName: string) {
    await this.page.getByTestId('open-ban-hero-browser-button').click();
    await expect(this.heroBrowserModal).toBeVisible();
    await this.page.getByTestId('hero-search-input').fill(heroName);
    await this.heroCardByName(heroName).getByRole('button', { name: 'Ban' }).click();
    await expect(this.heroBrowserModal).toHaveCount(0);
    await expect(this.banEntryByHeroName(heroName)).toBeVisible();
  }

  async addPreferredPick(heroName: string) {
    await this.page.getByTestId('open-preferred-pick-hero-browser-button').click();
    await expect(this.heroBrowserModal).toBeVisible();
    await this.page.getByTestId('hero-search-input').fill(heroName);
    await this.heroCardByName(heroName).getByRole('button', { name: 'Pick' }).click();
    await expect(this.heroBrowserModal).toHaveCount(0);
    await expect(this.preferredEntryByHeroName(heroName)).toBeVisible();
  }

  async saveBanNote(heroName: string, note: string) {
    const banEntry = this.banEntryByHeroName(heroName);
    await banEntry.getByLabel('Note').fill(note);
    await banEntry.getByRole('button', { name: 'Save Note' }).click();
    await expect(banEntry.getByLabel('Note')).toHaveValue(note);
  }

  async savePreferredPick(heroName: string, input: PreferredPickFormInput) {
    const preferredEntry = this.preferredEntryByHeroName(heroName);

    await preferredEntry.getByLabel('Role').fill(input.role);
    await preferredEntry.getByLabel('Priority').selectOption(input.priority);
    await preferredEntry.getByLabel('Note').fill(input.note);
    await preferredEntry.getByRole('button', { name: 'Save Changes' }).click();

    await expect(preferredEntry.getByLabel('Role')).toHaveValue(input.role);
    await expect(preferredEntry.getByLabel('Priority')).toHaveValue(input.priority);
    await expect(preferredEntry.getByLabel('Note')).toHaveValue(input.note);
  }

  async goBackToOverview() {
    await this.page.getByRole('link', { name: 'All Plans' }).click();
    await expect(this.page).toHaveURL(/\/draft-plans$/);
  }
}
