import type { HeroRecord } from '@draft-plans/shared';
import type { Hero } from '@prisma/client';

export function toHeroResponse(hero: Hero): HeroRecord {
  return {
    id: hero.id,
    name: hero.name,
    localizedName: hero.localizedName,
    primaryAttr: hero.primaryAttr,
    attackType: hero.attackType,
    roles: hero.roles,
    imageUrl: hero.imageUrl,
    iconUrl: hero.iconUrl,
    createdAt: hero.createdAt.toISOString(),
    updatedAt: hero.updatedAt.toISOString(),
  };
}
