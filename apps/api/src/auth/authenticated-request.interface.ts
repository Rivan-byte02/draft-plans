import type { AuthUser } from '@draft-plans/shared';

export type AuthenticatedRequest = {
  headers: {
    authorization?: string;
  };
  user?: AuthUser;
};
