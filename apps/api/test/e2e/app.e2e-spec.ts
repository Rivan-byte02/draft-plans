import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import type { PrismaClient } from '@prisma/client';
import { ApiTestApp } from './support/api-test-app';
import { ExternalHeroesApiStub } from './support/external-heroes-api.stub';
import { externalHeroesFixture, seedBaseData } from './support/fixtures';
import { applyTestEnvironment } from './support/test-env';
import { createTestPrismaClient, resetTestDatabase } from './support/test-database';

async function waitFor<TValue>(
  action: () => Promise<TValue>,
  options?: {
    timeoutMilliseconds?: number;
    intervalMilliseconds?: number;
  },
) {
  const timeoutMilliseconds = options?.timeoutMilliseconds ?? 5_000;
  const intervalMilliseconds = options?.intervalMilliseconds ?? 50;
  const startedAt = Date.now();

  let lastError: unknown;

  while (Date.now() - startedAt < timeoutMilliseconds) {
    try {
      return await action();
    } catch (error) {
      lastError = error;
      await new Promise<void>((resolve) => {
        setTimeout(resolve, intervalMilliseconds);
      });
    }
  }

  throw lastError ?? new Error('Timed out while waiting for async condition');
}

describe('draft plans api e2e', () => {
  applyTestEnvironment();

  const externalHeroesApiStub = new ExternalHeroesApiStub();
  let apiTestApp: ApiTestApp;
  let testPrisma: PrismaClient;

  before(async () => {
    process.env.BACKGROUND_JOB_POLL_INTERVAL_MS = '50';
    process.env.HERO_SYNC_JOB_DELAY_MS = '10';
    externalHeroesApiStub.setSuccessResponse(externalHeroesFixture);
    await externalHeroesApiStub.start();
    process.env.EXTERNAL_HEROES_URL = externalHeroesApiStub.url;

    testPrisma = await createTestPrismaClient();
    apiTestApp = await ApiTestApp.create();
  });

  after(async () => {
    if (apiTestApp) {
      await apiTestApp.close();
    }

    if (testPrisma) {
      await testPrisma.$disconnect();
    }

    await externalHeroesApiStub.close();
  });

  beforeEach(async () => {
    await resetTestDatabase(testPrisma);
    await seedBaseData(testPrisma);
    externalHeroesApiStub.setSuccessResponse(externalHeroesFixture);
    externalHeroesApiStub.setResponseDelay(0);
    externalHeroesApiStub.resetRequestCount();
  });

  it('GET /health returns service status', async () => {
    const response = await apiTestApp.request('/health');

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, {
      status: 'ok',
      service: 'draft-plans-api',
    });
  });

  it('GET /heroes returns the seeded hero list', async () => {
    const response = await apiTestApp.request<Array<{ localizedName: string }>>('/heroes');

    assert.equal(response.status, 200);
    assert.equal(response.body.length, 3);
    assert.deepEqual(
      response.body.map((hero) => hero.localizedName),
      ['Anti-Mage', 'Axe', 'Bane'],
    );
    assert.equal(externalHeroesApiStub.getRequestCount(), 0);
  });

  it('GET /heroes?refresh=true refreshes data from the external heroes source', async () => {
    const response = await apiTestApp.request<Array<{ id: number; localizedName: string }>>(
      '/heroes?refresh=true',
    );

    assert.equal(response.status, 200);
    assert.equal(response.body.length, 5);
    assert.deepEqual(
      response.body.map((hero) => hero.localizedName),
      ['Abaddon', 'Anti-Mage', 'Axe', 'Bane', 'Crystal Maiden'],
    );
    assert.equal(externalHeroesApiStub.getRequestCount(), 1);
  });

  it('GET /heroes/cache returns PostgreSQL-backed cache metadata', async () => {
    const response = await apiTestApp.request<{
      cacheKey: string;
      freshness: string;
      heroCount: number;
      activeJobId: string | null;
    }>('/heroes/cache');

    assert.equal(response.status, 200);
    assert.equal(response.body.cacheKey, 'open-dota-heroes');
    assert.equal(response.body.freshness, 'FRESH');
    assert.equal(response.body.heroCount, 3);
    assert.equal(response.body.activeJobId, null);
  });

  it('GET /heroes enqueues only one async refresh when the PostgreSQL cache is stale', async () => {
    await testPrisma.heroCacheState.update({
      where: { key: 'open-dota-heroes' },
      data: {
        expiresAt: new Date(Date.now() - 60_000),
      },
    });

    const firstResponse = await apiTestApp.request<Array<{ localizedName: string }>>('/heroes');
    const secondResponse = await apiTestApp.request<Array<{ localizedName: string }>>('/heroes');

    assert.equal(firstResponse.status, 200);
    assert.equal(secondResponse.status, 200);
    assert.deepEqual(
      firstResponse.body.map((hero) => hero.localizedName),
      ['Anti-Mage', 'Axe', 'Bane'],
    );

    const completedJobResponse = await waitFor(async () => {
      const response = await apiTestApp.request<{
        cacheKey: string;
        freshness: string;
        heroCount: number;
        activeJobId: string | null;
      }>('/heroes/cache');

      if (response.body.freshness !== 'FRESH' || response.body.heroCount !== 5) {
        throw new Error('Hero cache is not refreshed yet');
      }

      return response;
    });

    assert.equal(completedJobResponse.status, 200);
    assert.equal(completedJobResponse.body.activeJobId, null);
    assert.equal(externalHeroesApiStub.getRequestCount(), 1);
  });

  it('POST /heroes/sync syncs heroes from the external heroes source', async () => {
    await resetTestDatabase(testPrisma);

    const response = await apiTestApp.request<{
      syncedCount: number;
      syncedAt: string;
      cacheExpiresAt: string;
      cacheKey: string;
    }>('/heroes/sync', {
      method: 'POST',
    });

    assert.equal(response.status, 201);
    assert.deepEqual(response.body, {
      syncedCount: 2,
      syncedAt: response.body.syncedAt,
      cacheExpiresAt: response.body.cacheExpiresAt,
      cacheKey: 'open-dota-heroes',
    });

    const heroesInDatabase = await testPrisma.hero.findMany({
      orderBy: { id: 'asc' },
      select: { id: true, localizedName: true },
    });

    assert.deepEqual(heroesInDatabase, [
      { id: 4, localizedName: 'Abaddon' },
      { id: 5, localizedName: 'Crystal Maiden' },
    ]);
  });

  it('POST /heroes/sync-jobs deduplicates and completes a PostgreSQL-backed long-running task', async () => {
    externalHeroesApiStub.setResponseDelay(150);

    const firstResponse = await apiTestApp.request<{
      created: boolean;
      job: { id: string; status: string; progress: number };
      cache: { activeJobId: string | null };
    }>('/heroes/sync-jobs', {
      method: 'POST',
    });

    const secondResponse = await apiTestApp.request<{
      created: boolean;
      job: { id: string; status: string; progress: number };
      cache: { activeJobId: string | null };
    }>('/heroes/sync-jobs', {
      method: 'POST',
    });

    assert.equal(firstResponse.status, 201);
    assert.equal(firstResponse.body.created, true);
    assert.equal(secondResponse.status, 201);
    assert.equal(secondResponse.body.created, false);
    assert.equal(secondResponse.body.job.id, firstResponse.body.job.id);

    const runningJobResponse = await waitFor(async () => {
      const response = await apiTestApp.request<{
        job: { status: string; progress: number };
      }>(`/heroes/sync-jobs/${firstResponse.body.job.id}`);

      if (response.body.job.status === 'QUEUED') {
        throw new Error('Background job is still queued');
      }

      return response;
    });

    assert.equal(
      ['RUNNING', 'SUCCEEDED'].includes(runningJobResponse.body.job.status),
      true,
    );

    const completedJobResponse = await waitFor(async () => {
      const response = await apiTestApp.request<{
        job: { status: string; progress: number; completedAt: string | null };
        cache: { freshness: string; heroCount: number; activeJobId: string | null };
      }>(`/heroes/sync-jobs/${firstResponse.body.job.id}`);

      if (response.body.job.status !== 'SUCCEEDED') {
        throw new Error('Background hero sync job is not completed yet');
      }

      return response;
    });

    assert.equal(completedJobResponse.status, 200);
    assert.equal(completedJobResponse.body.job.status, 'SUCCEEDED');
    assert.equal(completedJobResponse.body.job.progress, 100);
    assert.equal(completedJobResponse.body.cache.freshness, 'FRESH');
    assert.equal(completedJobResponse.body.cache.heroCount, 5);
    assert.equal(completedJobResponse.body.cache.activeJobId, null);
    assert.equal(externalHeroesApiStub.getRequestCount(), 1);
  });

  it('POST /heroes/sync returns 503 when the external heroes source fails', async () => {
    externalHeroesApiStub.setFailureResponse(503);

    const response = await apiTestApp.request<{ message: string }>('/heroes/sync', {
      method: 'POST',
    });

    assert.equal(response.status, 503);
    assert.equal(response.body.message, 'Failed to load heroes from OpenDota');
  });

  it('GET /draft-plans returns seeded summaries', async () => {
    const response = await apiTestApp.request<
      Array<{ id: string; name: string; banCount: number; preferredPickCount: number }>
    >('/draft-plans');

    assert.equal(response.status, 200);
    assert.equal(response.body.length, 1);
    assert.equal(response.body[0]?.id, 'sample-draft-plan');
    assert.equal(response.body[0]?.name, 'Sample Captain Mode Plan');
    assert.equal(response.body[0]?.banCount, 1);
    assert.equal(response.body[0]?.preferredPickCount, 1);
  });

  it('POST /draft-plans creates a new draft plan', async () => {
    const response = await apiTestApp.request<{
      id: string;
      name: string;
      description: string;
      banList: unknown[];
      preferredPicks: unknown[];
    }>('/draft-plans', {
      method: 'POST',
      body: {
        name: 'E2E Test Plan',
        description: 'Created by the backend E2E suite.',
      },
    });

    assert.equal(response.status, 201);
    assert.equal(response.body.name, 'E2E Test Plan');
    assert.equal(response.body.description, 'Created by the backend E2E suite.');
    assert.deepEqual(response.body.banList, []);
    assert.deepEqual(response.body.preferredPicks, []);

    const createdDraftPlan = await testPrisma.draftPlan.findUnique({
      where: { id: response.body.id },
      select: { name: true, description: true },
    });

    assert.deepEqual(createdDraftPlan, {
      name: 'E2E Test Plan',
      description: 'Created by the backend E2E suite.',
    });
  });

  it('DELETE /draft-plans/:id soft deletes a draft plan', async () => {
    const response = await apiTestApp.request<{ id: string; deletedAt: string }>(
      '/draft-plans/sample-draft-plan',
      {
        method: 'DELETE',
      },
    );

    assert.equal(response.status, 200);
    assert.equal(response.body.id, 'sample-draft-plan');
    assert.ok(response.body.deletedAt);

    const deletedPlan = await testPrisma.draftPlan.findUnique({
      where: { id: 'sample-draft-plan' },
      select: { deletedAt: true },
    });

    assert.ok(deletedPlan?.deletedAt);

    const deletedEntriesCount = await testPrisma.draftPlanHeroEntry.count({
      where: {
        draftPlanId: 'sample-draft-plan',
        deletedAt: {
          not: null,
        },
      },
    });

    assert.equal(deletedEntriesCount, 2);

    const listResponse = await apiTestApp.request<Array<{ id: string }>>('/draft-plans');
    assert.equal(
      listResponse.body.some((draftPlan) => draftPlan.id === 'sample-draft-plan'),
      false,
    );

    const detailsResponse = await apiTestApp.request<{ message: string }>(
      '/draft-plans/sample-draft-plan',
    );
    assert.equal(detailsResponse.status, 404);
    assert.equal(detailsResponse.body.message, 'Draft plan not found');
  });

  it('POST /draft-plans validates request payloads', async () => {
    const response = await apiTestApp.request<{ message: string[] }>('/draft-plans', {
      method: 'POST',
      body: {
        description: 'Missing required name field.',
        extraField: 'should be rejected',
      },
    });

    assert.equal(response.status, 400);
    assert.equal(response.body.message.includes('property extraField should not exist'), true);
    assert.equal(response.body.message.includes('name must be a string'), true);
  });

  it('GET /draft-plans/:id returns draft plan details', async () => {
    const response = await apiTestApp.request<{
      id: string;
      name: string;
      banList: Array<{ heroName: string }>;
      preferredPicks: Array<{ heroName: string; priority: string }>;
    }>('/draft-plans/sample-draft-plan');

    assert.equal(response.status, 200);
    assert.equal(response.body.id, 'sample-draft-plan');
    assert.equal(response.body.name, 'Sample Captain Mode Plan');
    assert.equal(response.body.banList[0]?.heroName, 'Axe');
    assert.equal(response.body.preferredPicks[0]?.heroName, 'Anti-Mage');
    assert.equal(response.body.preferredPicks[0]?.priority, 'HIGH');
  });

  it('GET /draft-plans/:id returns 404 for unknown draft plans', async () => {
    const response = await apiTestApp.request<{ message: string }>('/draft-plans/unknown-plan-id');

    assert.equal(response.status, 404);
    assert.equal(response.body.message, 'Draft plan not found');
  });

  it('POST/PATCH/DELETE /draft-plans/:id/bans manages ban entries', async () => {
    const createdEntryResponse = await apiTestApp.request<{
      banList: Array<{ id: string; heroId: number; note: string | null }>;
    }>('/draft-plans/sample-draft-plan/bans', {
      method: 'POST',
      body: {
        heroId: 3,
        note: 'Ban Bane when the enemy team wants reliable lockdown.',
      },
    });

    assert.equal(createdEntryResponse.status, 201);
    const createdEntry = createdEntryResponse.body.banList.find((entry) => entry.heroId === 3);
    assert.ok(createdEntry);
    assert.equal(createdEntry.note, 'Ban Bane when the enemy team wants reliable lockdown.');

    const duplicateEntryResponse = await apiTestApp.request<{ message: string }>(
      '/draft-plans/sample-draft-plan/bans',
      {
        method: 'POST',
        body: {
          heroId: 3,
        },
      },
    );

    assert.equal(duplicateEntryResponse.status, 409);
    assert.equal(
      duplicateEntryResponse.body.message,
      'Hero already exists in this draft plan section',
    );

    const updatedEntryResponse = await apiTestApp.request<{
      banList: Array<{ id: string; note: string | null }>;
    }>(`/draft-plans/sample-draft-plan/bans/${createdEntry.id}`, {
      method: 'PATCH',
      body: {
        note: 'Update the ban note from the backend E2E suite.',
      },
    });

    assert.equal(updatedEntryResponse.status, 200);
    const updatedEntry = updatedEntryResponse.body.banList.find(
      (entry) => entry.id === createdEntry.id,
    );
    assert.ok(updatedEntry);
    assert.equal(updatedEntry.note, 'Update the ban note from the backend E2E suite.');

    const deletedEntryResponse = await apiTestApp.request<{
      banList: Array<{ id: string }>;
    }>(`/draft-plans/sample-draft-plan/bans/${createdEntry.id}`, {
      method: 'DELETE',
    });

    assert.equal(deletedEntryResponse.status, 200);
    assert.equal(
      deletedEntryResponse.body.banList.some((entry) => entry.id === createdEntry.id),
      false,
    );

    const deletedEntryRecord = await testPrisma.draftPlanHeroEntry.findUnique({
      where: { id: createdEntry.id },
      select: { deletedAt: true },
    });

    assert.ok(deletedEntryRecord?.deletedAt);

    const recreatedEntryResponse = await apiTestApp.request<{
      banList: Array<{ id: string; heroId: number }>;
    }>('/draft-plans/sample-draft-plan/bans', {
      method: 'POST',
      body: {
        heroId: 3,
      },
    });

    assert.equal(recreatedEntryResponse.status, 201);
    assert.equal(
      recreatedEntryResponse.body.banList.some((entry) => entry.heroId === 3),
      true,
    );
  });

  it('POST /draft-plans/:id/bans returns 404 when the hero does not exist', async () => {
    const response = await apiTestApp.request<{ message: string }>(
      '/draft-plans/sample-draft-plan/bans',
      {
        method: 'POST',
        body: {
          heroId: 999,
        },
      },
    );

    assert.equal(response.status, 404);
    assert.equal(response.body.message, 'Hero not found. Sync heroes from OpenDota first.');
  });

  it('POST/PATCH/DELETE /draft-plans/:id/preferred-picks manages preferred picks', async () => {
    const createdEntryResponse = await apiTestApp.request<{
      preferredPicks: Array<{
        id: string;
        heroId: number;
        role: string | null;
        priority: string | null;
        note: string | null;
      }>;
    }>('/draft-plans/sample-draft-plan/preferred-picks', {
      method: 'POST',
      body: {
        heroId: 3,
        role: 'Support',
        priority: 'MEDIUM',
        note: 'Flexible support pick with strong control.',
      },
    });

    assert.equal(createdEntryResponse.status, 201);
    const createdEntry = createdEntryResponse.body.preferredPicks.find(
      (entry) => entry.heroId === 3,
    );
    assert.ok(createdEntry);
    assert.equal(createdEntry.role, 'Support');
    assert.equal(createdEntry.priority, 'MEDIUM');
    assert.equal(createdEntry.note, 'Flexible support pick with strong control.');

    const updatedEntryResponse = await apiTestApp.request<{
      preferredPicks: Array<{
        id: string;
        role: string | null;
        priority: string | null;
        note: string | null;
      }>;
    }>(`/draft-plans/sample-draft-plan/preferred-picks/${createdEntry.id}`, {
      method: 'PATCH',
      body: {
        role: 'Position 5',
        priority: 'LOW',
        note: 'Lower priority fallback if lanes demand more disable.',
      },
    });

    assert.equal(updatedEntryResponse.status, 200);
    const updatedEntry = updatedEntryResponse.body.preferredPicks.find(
      (entry) => entry.id === createdEntry.id,
    );
    assert.ok(updatedEntry);
    assert.equal(updatedEntry.role, 'Position 5');
    assert.equal(updatedEntry.priority, 'LOW');
    assert.equal(updatedEntry.note, 'Lower priority fallback if lanes demand more disable.');

    const deletedEntryResponse = await apiTestApp.request<{
      preferredPicks: Array<{ id: string }>;
    }>(`/draft-plans/sample-draft-plan/preferred-picks/${createdEntry.id}`, {
      method: 'DELETE',
    });

    assert.equal(deletedEntryResponse.status, 200);
    assert.equal(
      deletedEntryResponse.body.preferredPicks.some((entry) => entry.id === createdEntry.id),
      false,
    );

    const deletedEntryRecord = await testPrisma.draftPlanHeroEntry.findUnique({
      where: { id: createdEntry.id },
      select: { deletedAt: true },
    });

    assert.ok(deletedEntryRecord?.deletedAt);

    const recreatedEntryResponse = await apiTestApp.request<{
      preferredPicks: Array<{ id: string; heroId: number }>;
    }>('/draft-plans/sample-draft-plan/preferred-picks', {
      method: 'POST',
      body: {
        heroId: 3,
        priority: 'HIGH',
      },
    });

    assert.equal(recreatedEntryResponse.status, 201);
    assert.equal(
      recreatedEntryResponse.body.preferredPicks.some((entry) => entry.heroId === 3),
      true,
    );
  });

  it('PATCH /draft-plans/:id/preferred-picks/:entryId validates the priority field', async () => {
    const response = await apiTestApp.request<{ message: string[] }>(
      '/draft-plans/sample-draft-plan/preferred-picks/invalid-entry-id',
      {
        method: 'PATCH',
        body: {
          priority: 'TOP',
        },
      },
    );

    assert.equal(response.status, 400);
    assert.equal(
      response.body.message.includes(
        'priority must be one of the following values: HIGH, MEDIUM, LOW',
      ),
      true,
    );
  });
});
