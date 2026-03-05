import type { AuthSession, LoginPayload } from '@draft-plans/shared';
import { apiRequest } from '@/lib/api/client';

export function login(payload: LoginPayload) {
  return apiRequest<AuthSession>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
