import { Injectable, UnauthorizedException, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedRequest } from './authenticated-request.interface';
import { AuthService } from './auth.service';
import { isPublicRouteKey } from './public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const isPublicRoute = this.reflector.getAllAndOverride<boolean>(isPublicRouteKey, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublicRoute) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader) {
      throw new UnauthorizedException('Authorization header is required');
    }

    const [tokenType, accessToken] = authorizationHeader.split(' ');

    if (tokenType !== 'Bearer' || !accessToken) {
      throw new UnauthorizedException('Authorization header must use Bearer token');
    }

    request.user = await this.authService.authenticateAccessToken(accessToken);
    return true;
  }
}
