import { expect, type Locator, type Page } from '@playwright/test';

type CreateDraftPlanInput = {
  name: string;
  description: string;
};

export class DraftPlansPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly loginForm: Locator;
  readonly openCreateDraftPlanButton: Locator;
  readonly createDraftPlanForm: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Draft Plans', level: 1 });
    this.loginForm = page.getByTestId('login-form');
    this.openCreateDraftPlanButton = page.getByTestId('open-create-draft-plan-button');
    this.createDraftPlanForm = page.getByTestId('create-draft-plan-form');
  }

  async goto() {
    await this.page.goto('/draft-plans');
    const isLoginPageVisible = await this.loginForm.isVisible().catch(() => false);

    if (isLoginPageVisible) {
      await this.page.getByTestId('login-email-input').fill('demo@draftplans.dev');
      await this.page.getByTestId('login-password-input').fill('demo12345');
      await this.page.getByTestId('login-submit-button').click();
    }

    await expect(this.heading).toBeVisible();
  }

  draftPlanCardByName(planName: string) {
    return this.page
      .locator('[data-testid^="draft-plan-card-"]')
      .filter({ hasText: planName })
      .first();
  }

  async createDraftPlan(input: CreateDraftPlanInput) {
    await this.openCreateDraftPlanButton.click();
    await expect(this.createDraftPlanForm).toBeVisible();

    await this.createDraftPlanForm.getByLabel('Name').fill(input.name);
    await this.createDraftPlanForm.getByLabel('Description').fill(input.description);
    await this.createDraftPlanForm.getByTestId('submit-create-draft-plan-button').click();
  }

  async openDraftPlan(planName: string) {
    await this.draftPlanCardByName(planName).click();
  }
}
