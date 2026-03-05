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

  async closeHeroBrowserIfOpen() {
    const isHeroBrowserOpen = await this.heroBrowserModal.isVisible().catch(() => false);
    if (!isHeroBrowserOpen) {
      return;
    }

    await this.page.getByRole('button', { name: 'Close hero browser' }).click();
    await expect(this.heroBrowserModal).toHaveCount(0);
  }

  async addBan(heroName: string, options?: { keepHeroBrowserOpen?: boolean }) {
    const isHeroBrowserOpen = await this.heroBrowserModal.isVisible().catch(() => false);
    if (!isHeroBrowserOpen) {
      await this.page.getByTestId('open-ban-hero-browser-button').click();
    }

    await expect(this.heroBrowserModal).toBeVisible();
    await this.page.getByTestId('hero-search-input').fill(heroName);
    const heroCard = this.heroCardByName(heroName);
    await heroCard.getByRole('button', { name: 'Ban' }).click();
    await expect(heroCard.getByRole('button', { name: 'Ban' })).toBeDisabled();
    await expect(heroCard.getByRole('button', { name: 'Pick' })).toBeDisabled();

    if (!options?.keepHeroBrowserOpen) {
      await this.page.getByRole('button', { name: 'Close hero browser' }).click();
      await expect(this.heroBrowserModal).toHaveCount(0);
    }

    await expect(this.banEntryByHeroName(heroName)).toBeVisible();
  }

  async addPreferredPick(heroName: string, options?: { keepHeroBrowserOpen?: boolean }) {
    const isHeroBrowserOpen = await this.heroBrowserModal.isVisible().catch(() => false);
    if (!isHeroBrowserOpen) {
      await this.page.getByTestId('open-preferred-pick-hero-browser-button').click();
    }

    await expect(this.heroBrowserModal).toBeVisible();
    await this.page.getByTestId('hero-search-input').fill(heroName);
    const heroCard = this.heroCardByName(heroName);
    await heroCard.getByRole('button', { name: 'Pick' }).click();
    await expect(heroCard.getByRole('button', { name: 'Ban' })).toBeDisabled();
    await expect(heroCard.getByRole('button', { name: 'Pick' })).toBeDisabled();

    if (!options?.keepHeroBrowserOpen) {
      await this.page.getByRole('button', { name: 'Close hero browser' }).click();
      await expect(this.heroBrowserModal).toHaveCount(0);
    }

    await expect(this.preferredEntryByHeroName(heroName)).toBeVisible();
  }

  async saveBanNote(heroName: string, note: string) {
    const banEntry = this.banEntryByHeroName(heroName);
    await banEntry.click();

    const noteInput = banEntry.getByTestId('ban-entry-note-input');
    await noteInput.fill(note);
    await banEntry.getByTestId('ban-entry-save-button').click();
    await expect(noteInput).toHaveValue(note);
  }

  async savePreferredPick(heroName: string, input: PreferredPickFormInput) {
    const preferredEntry = this.preferredEntryByHeroName(heroName);
    await preferredEntry.click();

    const roleInput = preferredEntry.getByTestId('preferred-entry-role-input');
    const prioritySelect = preferredEntry.getByTestId('preferred-entry-priority-select');
    const noteInput = preferredEntry.getByTestId('preferred-entry-note-input');

    await roleInput.fill(input.role);
    await prioritySelect.selectOption(input.priority);
    await noteInput.fill(input.note);
    await preferredEntry.getByTestId('preferred-entry-save-button').click();

    await expect(roleInput).toHaveValue(input.role);
    await expect(prioritySelect).toHaveValue(input.priority);
    await expect(noteInput).toHaveValue(input.note);
  }

  async goBackToOverview() {
    await this.page.getByRole('link', { name: 'All Plans' }).click();
    await expect(this.page).toHaveURL(/\/draft-plans$/);
  }
}
