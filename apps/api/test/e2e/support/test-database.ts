import { PrismaClient, type Prisma } from '@prisma/client';

export async function createTestPrismaClient() {
  const prisma = new PrismaClient();
  await prisma.$connect();
  return prisma;
}

export async function resetTestDatabase(prisma: PrismaClient) {
  await prisma.$transaction([
    prisma.draftPlanHeroEntry.deleteMany(),
    prisma.backgroundJob.deleteMany(),
    prisma.draftPlan.deleteMany(),
    prisma.heroCacheState.deleteMany(),
    prisma.hero.deleteMany(),
    prisma.user.deleteMany(),
  ] satisfies Prisma.PrismaPromise<unknown>[]);
}
