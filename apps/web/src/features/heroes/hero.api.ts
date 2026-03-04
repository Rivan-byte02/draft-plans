import type { HeroRecord, HeroSyncResult } from '@draft-plans/shared';
import { apiRequest } from '@/lib/api/client';

export const heroQueryKeys = {
  all: ['heroes'] as const,
};

export function listHeroes() {
  return apiRequest<HeroRecord[]>('/heroes');
}

export function syncHeroes() {
  return apiRequest<HeroSyncResult>('/heroes/sync', {
    method: 'POST',
  });
}
