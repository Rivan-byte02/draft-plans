import { createParamDecorator, type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { AuthUser } from '@draft-plans/shared';
import type { AuthenticatedRequest } from './authenticated-request.interface';

export const CurrentUser = createParamDecorator(
  (_: unknown, context: ExecutionContext): AuthUser => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const currentUser = request.user;

    if (!currentUser) {
      throw new UnauthorizedException('Authentication is required');
    }

    return currentUser;
  },
);
