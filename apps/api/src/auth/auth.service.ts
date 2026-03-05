import type { AuthSession } from '@draft-plans/shared';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  createAccessToken,
  toAuthUserFromTokenPayload,
  verifyAccessToken,
} from './auth-token.util';
import { verifyPassword } from './password-hash.util';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async login(dto: LoginDto): Promise<AuthSession> {
    const account = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        deletedAt: true,
      },
    });

    if (!account || account.deletedAt || !verifyPassword(dto.password, account.passwordHash)) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const expiresInHours = this.getTokenExpiresInHours();
    const issuedAtInSeconds = Math.floor(Date.now() / 1000);
    const expiresAtInSeconds = issuedAtInSeconds + expiresInHours * 60 * 60;
    const accessToken = createAccessToken(
      {
        sub: account.id,
        email: account.email,
        name: account.name,
        iat: issuedAtInSeconds,
        exp: expiresAtInSeconds,
      },
      this.getTokenSecret(),
    );

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresAt: new Date(expiresAtInSeconds * 1000).toISOString(),
      user: {
        id: account.id,
        email: account.email,
        name: account.name,
      },
    };
  }

  async authenticateAccessToken(accessToken: string) {
    const verifiedPayload = verifyAccessToken(accessToken, this.getTokenSecret());

    if (!verifiedPayload) {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    const account = await this.prisma.user.findUnique({
      where: { id: verifiedPayload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        deletedAt: true,
      },
    });

    if (!account || account.deletedAt) {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    return toAuthUserFromTokenPayload(verifiedPayload);
  }

  private getTokenSecret() {
    return process.env.AUTH_JWT_SECRET ?? 'draft-plans-dev-secret-change-me';
  }

  private getTokenExpiresInHours() {
    const rawHours = Number(process.env.AUTH_TOKEN_EXPIRES_IN_HOURS ?? '24');
    return Number.isFinite(rawHours) && rawHours > 0 ? rawHours : 24;
  }
}
