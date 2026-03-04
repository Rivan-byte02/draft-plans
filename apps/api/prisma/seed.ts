import { DraftPlanEntryType, DraftPlanPriority, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const heroCacheKey = 'open-dota-heroes';

async function main() {
  const now = new Date();
  const cacheExpiresAt = new Date(now.getTime() + 60 * 60 * 1000);

  await prisma.hero.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'npc_dota_hero_antimage',
      localizedName: 'Anti-Mage',
      primaryAttr: 'agi',
      attackType: 'Melee',
      roles: ['Carry', 'Escape', 'Nuker'],
      imageUrl: '/apps/dota2/images/dota_react/heroes/antimage.png?',
      iconUrl: '/apps/dota2/images/dota_react/heroes/icons/antimage.png?',
    },
  });

  await prisma.hero.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: 'npc_dota_hero_axe',
      localizedName: 'Axe',
      primaryAttr: 'str',
      attackType: 'Melee',
      roles: ['Initiator', 'Durable', 'Disabler'],
      imageUrl: '/apps/dota2/images/dota_react/heroes/axe.png?',
      iconUrl: '/apps/dota2/images/dota_react/heroes/icons/axe.png?',
    },
  });

  await prisma.hero.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      name: 'npc_dota_hero_bane',
      localizedName: 'Bane',
      primaryAttr: 'all',
      attackType: 'Ranged',
      roles: ['Support', 'Disabler', 'Nuker'],
      imageUrl: '/apps/dota2/images/dota_react/heroes/bane.png?',
      iconUrl: '/apps/dota2/images/dota_react/heroes/icons/bane.png?',
    },
  });

  const plan = await prisma.draftPlan.upsert({
    where: { id: 'sample-draft-plan' },
    update: {
      name: 'Sample Captain Mode Plan',
      description: 'Baseline seeded plan for local development.',
      deletedAt: null,
    },
    create: {
      id: 'sample-draft-plan',
      name: 'Sample Captain Mode Plan',
      description: 'Baseline seeded plan for local development.',
    },
  });

  const existingBanEntry = await prisma.draftPlanHeroEntry.findFirst({
    where: {
      draftPlanId: plan.id,
      heroId: 2,
      type: DraftPlanEntryType.BAN,
    },
    select: { id: true },
  });

  if (existingBanEntry) {
    await prisma.draftPlanHeroEntry.update({
      where: { id: existingBanEntry.id },
      data: {
        note: 'Prioritize banning strong offlane initiators.',
        deletedAt: null,
      },
    });
  } else {
    await prisma.draftPlanHeroEntry.create({
      data: {
        draftPlanId: plan.id,
        heroId: 2,
        type: DraftPlanEntryType.BAN,
        note: 'Prioritize banning strong offlane initiators.',
      },
    });
  }

  const existingPreferredEntry = await prisma.draftPlanHeroEntry.findFirst({
    where: {
      draftPlanId: plan.id,
      heroId: 1,
      type: DraftPlanEntryType.PREFERRED,
    },
    select: { id: true },
  });

  if (existingPreferredEntry) {
    await prisma.draftPlanHeroEntry.update({
      where: { id: existingPreferredEntry.id },
      data: {
        role: 'Carry',
        priority: DraftPlanPriority.HIGH,
        note: 'Protect the lane and play around timing windows.',
        deletedAt: null,
      },
    });
  } else {
    await prisma.draftPlanHeroEntry.create({
      data: {
        draftPlanId: plan.id,
        heroId: 1,
        type: DraftPlanEntryType.PREFERRED,
        role: 'Carry',
        priority: DraftPlanPriority.HIGH,
        note: 'Protect the lane and play around timing windows.',
      },
    });
  }

  await prisma.heroCacheState.upsert({
    where: {
      key: heroCacheKey,
    },
    update: {
      heroCount: 3,
      lastExternalRequestAt: now,
      lastSyncedAt: now,
      expiresAt: cacheExpiresAt,
      source: 'seed',
      lastError: null,
    },
    create: {
      key: heroCacheKey,
      heroCount: 3,
      lastExternalRequestAt: now,
      lastSyncedAt: now,
      expiresAt: cacheExpiresAt,
      source: 'seed',
      lastError: null,
    },
  });
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
