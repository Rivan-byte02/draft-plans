import { expect, test } from '@playwright/test';
import { DraftPlanDetailsPage } from './pages/draft-plan-details.page';
import { DraftPlansPage } from './pages/draft-plans.page';
import { createUniqueDraftPlanName } from './utils/test-data';

test.describe('draft plans e2e', () => {
  test('shows the seeded draft plan from the overview page', async ({ page }) => {
    const draftPlansPage = new DraftPlansPage(page);
    const draftPlanDetailsPage = new DraftPlanDetailsPage(page);

    await draftPlansPage.goto();
    await expect(draftPlansPage.draftPlanCardByName('Sample Captain Mode Plan')).toBeVisible();

    await draftPlansPage.openDraftPlan('Sample Captain Mode Plan');
    await draftPlanDetailsPage.expectLoaded('Sample Captain Mode Plan');
    await expect(draftPlanDetailsPage.banEntryByHeroName('Axe')).toBeVisible();
    await expect(draftPlanDetailsPage.preferredEntryByHeroName('Anti-Mage')).toBeVisible();
  });

  test('creates a draft plan and manages bans and preferred picks', async ({ page }) => {
    const draftPlansPage = new DraftPlansPage(page);
    const draftPlanDetailsPage = new DraftPlanDetailsPage(page);
    const draftPlanName = createUniqueDraftPlanName();

    await draftPlansPage.goto();
    await draftPlansPage.createDraftPlan({
      name: draftPlanName,
      description: 'Created from the Playwright end-to-end test suite.',
    });

    await draftPlanDetailsPage.expectLoaded(draftPlanName);

    await draftPlanDetailsPage.addBan('Bane');
    await draftPlanDetailsPage.saveBanNote(
      'Bane',
      'Ban reliable control to preserve a tempo-heavy composition.',
    );

    await draftPlanDetailsPage.addPreferredPick('Anti-Mage');
    await draftPlanDetailsPage.savePreferredPick('Anti-Mage', {
      role: 'Carry',
      priority: 'HIGH',
      note: 'Play for an item timing and protect the lane equilibrium.',
    });

    await draftPlanDetailsPage.goBackToOverview();

    const createdDraftPlanCard = draftPlansPage.draftPlanCardByName(draftPlanName);
    await expect(createdDraftPlanCard).toBeVisible();
    await expect(createdDraftPlanCard).toContainText('1 bans');
    await expect(createdDraftPlanCard).toContainText('1 picks');
  });
});
