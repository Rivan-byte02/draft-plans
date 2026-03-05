import { DraftPlanEntryType, DraftPlanPriority, type PrismaClient } from '@prisma/client';
import { hashPassword } from '../../../src/auth/password-hash.util';

const heroCacheKey = 'open-dota-heroes';
export const demoUserFixture = {
  id: 'test-user-demo',
  email: 'demo@draftplans.dev',
  name: 'Demo User',
  password: 'demo12345',
};

export const rivalUserFixture = {
  id: 'test-user-rival',
  email: 'rival@draftplans.dev',
  name: 'Rival User',
  password: 'rival12345',
};

export const externalHeroesFixture = [
  {
    id: 4,
    name: 'npc_dota_hero_abaddon',
    localized_name: 'Abaddon',
    primary_attr: 'str',
    attack_type: 'Melee',
    roles: ['Support', 'Carry', 'Durable'],
    img: '/apps/dota2/images/dota_react/heroes/abaddon.png?',
    icon: '/apps/dota2/images/dota_react/heroes/icons/abaddon.png?',
  },
  {
    id: 5,
    name: 'npc_dota_hero_crystal_maiden',
    localized_name: 'Crystal Maiden',
    primary_attr: 'int',
    attack_type: 'Ranged',
    roles: ['Support', 'Disabler', 'Nuker'],
    img: '/apps/dota2/images/dota_react/heroes/crystal_maiden.png?',
    icon: '/apps/dota2/images/dota_react/heroes/icons/crystal_maiden.png?',
  },
];

export async function seedBaseData(prisma: PrismaClient) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);

  const demoUser = await prisma.user.create({
    data: {
      id: demoUserFixture.id,
      email: demoUserFixture.email,
      name: demoUserFixture.name,
      passwordHash: hashPassword(demoUserFixture.password),
    },
  });

  await prisma.user.create({
    data: {
      id: rivalUserFixture.id,
      email: rivalUserFixture.email,
      name: rivalUserFixture.name,
      passwordHash: hashPassword(rivalUserFixture.password),
    },
  });

  await prisma.hero.createMany({
    data: [
      {
        id: 1,
        name: 'npc_dota_hero_antimage',
        localizedName: 'Anti-Mage',
        primaryAttr: 'agi',
        attackType: 'Melee',
        roles: ['Carry', 'Escape', 'Nuker'],
        imageUrl: '/apps/dota2/images/dota_react/heroes/antimage.png?',
        iconUrl: '/apps/dota2/images/dota_react/heroes/icons/antimage.png?',
      },
      {
        id: 2,
        name: 'npc_dota_hero_axe',
        localizedName: 'Axe',
        primaryAttr: 'str',
        attackType: 'Melee',
        roles: ['Initiator', 'Durable', 'Disabler'],
        imageUrl: '/apps/dota2/images/dota_react/heroes/axe.png?',
        iconUrl: '/apps/dota2/images/dota_react/heroes/icons/axe.png?',
      },
      {
        id: 3,
        name: 'npc_dota_hero_bane',
        localizedName: 'Bane',
        primaryAttr: 'all',
        attackType: 'Ranged',
        roles: ['Support', 'Disabler', 'Nuker'],
        imageUrl: '/apps/dota2/images/dota_react/heroes/bane.png?',
        iconUrl: '/apps/dota2/images/dota_react/heroes/icons/bane.png?',
      },
    ],
  });

  const sampleDraftPlan = await prisma.draftPlan.create({
    data: {
      id: 'sample-draft-plan',
      ownerId: demoUser.id,
      name: 'Sample Captain Mode Plan',
      description: 'Baseline seeded plan for local development.',
    },
  });

  const sampleBanEntry = await prisma.draftPlanHeroEntry.create({
    data: {
      draftPlanId: sampleDraftPlan.id,
      heroId: 2,
      type: DraftPlanEntryType.BAN,
      note: 'Prioritize banning strong offlane initiators.',
    },
  });

  const samplePreferredEntry = await prisma.draftPlanHeroEntry.create({
    data: {
      draftPlanId: sampleDraftPlan.id,
      heroId: 1,
      type: DraftPlanEntryType.PREFERRED,
      role: 'Carry',
      priority: DraftPlanPriority.HIGH,
      note: 'Protect the lane and play around timing windows.',
    },
  });

  await prisma.heroCacheState.create({
    data: {
      key: heroCacheKey,
      heroCount: 3,
      lastExternalRequestAt: now,
      lastSyncedAt: now,
      expiresAt,
      source: 'test-fixture',
    },
  });

  return {
    sampleDraftPlan,
    sampleBanEntry,
    samplePreferredEntry,
  };
}
