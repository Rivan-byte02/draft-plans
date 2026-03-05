import { DraftPlanEntryType, DraftPlanPriority, PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/auth/password-hash.util';

const prisma = new PrismaClient();
const heroCacheKey = 'open-dota-heroes';
const externalHeroesUrl = process.env.EXTERNAL_HEROES_URL ?? 'https://api.opendota.com/api/heroStats';
const demoUserEmail = 'demo@draftplans.dev';
const demoUserPassword = 'demo12345';
const rivalUserEmail = 'rival@draftplans.dev';
const rivalUserPassword = 'rival12345';
const fallbackSeedHeroes: OpenDotaHeroRecord[] = [
  {
    id: 1,
    name: 'npc_dota_hero_antimage',
    localized_name: 'Anti-Mage',
    primary_attr: 'agi',
    attack_type: 'Melee',
    roles: ['Carry', 'Escape', 'Nuker'],
    img: '/apps/dota2/images/dota_react/heroes/antimage.png?',
    icon: '/apps/dota2/images/dota_react/heroes/icons/antimage.png?',
  },
  {
    id: 2,
    name: 'npc_dota_hero_axe',
    localized_name: 'Axe',
    primary_attr: 'str',
    attack_type: 'Melee',
    roles: ['Initiator', 'Durable', 'Disabler'],
    img: '/apps/dota2/images/dota_react/heroes/axe.png?',
    icon: '/apps/dota2/images/dota_react/heroes/icons/axe.png?',
  },
  {
    id: 3,
    name: 'npc_dota_hero_bane',
    localized_name: 'Bane',
    primary_attr: 'all',
    attack_type: 'Ranged',
    roles: ['Support', 'Disabler', 'Nuker'],
    img: '/apps/dota2/images/dota_react/heroes/bane.png?',
    icon: '/apps/dota2/images/dota_react/heroes/icons/bane.png?',
  },
];

type OpenDotaHeroRecord = {
  id: number;
  name: string;
  localized_name: string;
  primary_attr: string | null;
  attack_type: string | null;
  roles: string[] | null;
  img: string | null;
  icon: string | null;
};

async function syncHeroesFromOpenDota() {
  const requestedAt = new Date();

  try {
    const response = await fetch(externalHeroesUrl);

    if (!response.ok) {
      throw new Error(`OpenDota responded with ${response.status}`);
    }

    const openDotaHeroes = (await response.json()) as OpenDotaHeroRecord[];
    await upsertHeroCatalog(openDotaHeroes);

    return {
      synced: true,
      requestedAt,
      syncedAt: new Date(),
      errorMessage: null as string | null,
      source: externalHeroesUrl,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown OpenDota sync error';
    console.warn(`Hero seed sync fallback: ${errorMessage}`);

    return {
      synced: false,
      requestedAt,
      syncedAt: null as Date | null,
      errorMessage: errorMessage,
      source: externalHeroesUrl,
    };
  }
}

async function upsertHeroCatalog(heroes: OpenDotaHeroRecord[]) {
  for (const openDotaHero of heroes) {
    await prisma.hero.upsert({
      where: { id: openDotaHero.id },
      update: {
        name: openDotaHero.name,
        localizedName: openDotaHero.localized_name,
        primaryAttr: openDotaHero.primary_attr,
        attackType: openDotaHero.attack_type,
        roles: openDotaHero.roles ?? [],
        imageUrl: openDotaHero.img,
        iconUrl: openDotaHero.icon,
      },
      create: {
        id: openDotaHero.id,
        name: openDotaHero.name,
        localizedName: openDotaHero.localized_name,
        primaryAttr: openDotaHero.primary_attr,
        attackType: openDotaHero.attack_type,
        roles: openDotaHero.roles ?? [],
        imageUrl: openDotaHero.img,
        iconUrl: openDotaHero.icon,
      },
    });
  }
}

async function main() {
  const demoUser = await prisma.user.upsert({
    where: { email: demoUserEmail },
    update: {
      name: 'Demo User',
      passwordHash: hashPassword(demoUserPassword),
      deletedAt: null,
    },
    create: {
      id: 'seed-user-local',
      email: demoUserEmail,
      name: 'Demo User',
      passwordHash: hashPassword(demoUserPassword),
    },
  });

  await prisma.user.upsert({
    where: { email: rivalUserEmail },
    update: {
      name: 'Rival User',
      passwordHash: hashPassword(rivalUserPassword),
      deletedAt: null,
    },
    create: {
      id: 'seed-user-rival',
      email: rivalUserEmail,
      name: 'Rival User',
      passwordHash: hashPassword(rivalUserPassword),
    },
  });

  const heroSyncResult = await syncHeroesFromOpenDota();
  let fallbackHeroesUsed = false;
  let totalHeroCount = await prisma.hero.count();

  if (totalHeroCount === 0) {
    await upsertHeroCatalog(fallbackSeedHeroes);
    fallbackHeroesUsed = true;
    totalHeroCount = await prisma.hero.count();
  }

  const now = new Date();
  const cacheExpiresAt = new Date(now.getTime() + 60 * 60 * 1000);

  const plan = await prisma.draftPlan.upsert({
    where: { id: 'sample-draft-plan' },
    update: {
      ownerId: demoUser.id,
      name: 'Sample Captain Mode Plan',
      description: 'Baseline seeded plan for local development.',
      deletedAt: null,
    },
    create: {
      id: 'sample-draft-plan',
      ownerId: demoUser.id,
      name: 'Sample Captain Mode Plan',
      description: 'Baseline seeded plan for local development.',
    },
  });

  if (totalHeroCount > 0) {
    const axe = await prisma.hero.findUnique({
      where: { id: 2 },
      select: { id: true },
    });
    const antiMage = await prisma.hero.findUnique({
      where: { id: 1 },
      select: { id: true },
    });

    if (axe) {
      const existingBanEntry = await prisma.draftPlanHeroEntry.findFirst({
        where: {
          draftPlanId: plan.id,
          heroId: axe.id,
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
            heroId: axe.id,
            type: DraftPlanEntryType.BAN,
            note: 'Prioritize banning strong offlane initiators.',
          },
        });
      }
    }

    if (antiMage) {
      const existingPreferredEntry = await prisma.draftPlanHeroEntry.findFirst({
        where: {
          draftPlanId: plan.id,
          heroId: antiMage.id,
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
            heroId: antiMage.id,
            type: DraftPlanEntryType.PREFERRED,
            role: 'Carry',
            priority: DraftPlanPriority.HIGH,
            note: 'Protect the lane and play around timing windows.',
          },
        });
      }
    }
  }

  await prisma.heroCacheState.upsert({
    where: {
      key: heroCacheKey,
    },
    update: {
      heroCount: totalHeroCount,
      lastExternalRequestAt: heroSyncResult.requestedAt,
      lastSyncedAt: heroSyncResult.syncedAt,
      expiresAt: heroSyncResult.synced && !fallbackHeroesUsed ? cacheExpiresAt : null,
      source: fallbackHeroesUsed ? 'seed-fallback' : heroSyncResult.source,
      lastError: heroSyncResult.errorMessage,
    },
    create: {
      key: heroCacheKey,
      heroCount: totalHeroCount,
      lastExternalRequestAt: heroSyncResult.requestedAt,
      lastSyncedAt: heroSyncResult.syncedAt,
      expiresAt: heroSyncResult.synced && !fallbackHeroesUsed ? cacheExpiresAt : null,
      source: fallbackHeroesUsed ? 'seed-fallback' : heroSyncResult.source,
      lastError: heroSyncResult.errorMessage,
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
