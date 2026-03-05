import { createHmac, timingSafeEqual } from 'node:crypto';
import type { AuthUser } from '@draft-plans/shared';

export type AccessTokenPayload = {
  sub: string;
  email: string;
  name: string;
  iat: number;
  exp: number;
};

const expectedJwtHeader = {
  alg: 'HS256',
  typ: 'JWT',
};

function encodeBase64Url(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function createSignature(input: string, secret: string) {
  return createHmac('sha256', secret).update(input).digest('base64url');
}

export function createAccessToken(payload: AccessTokenPayload, secret: string) {
  const encodedHeader = encodeBase64Url(JSON.stringify(expectedJwtHeader));
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const signature = createSignature(unsignedToken, secret);

  return `${unsignedToken}.${signature}`;
}

export function verifyAccessToken(token: string, secret: string) {
  const [encodedHeader, encodedPayload, receivedSignature] = token.split('.');

  if (!encodedHeader || !encodedPayload || !receivedSignature) {
    return null;
  }

  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = createSignature(unsignedToken, secret);
  const expectedSignatureBuffer = Buffer.from(expectedSignature, 'utf8');
  const receivedSignatureBuffer = Buffer.from(receivedSignature, 'utf8');

  if (expectedSignatureBuffer.length !== receivedSignatureBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(expectedSignatureBuffer, receivedSignatureBuffer)) {
    return null;
  }

  let decodedHeader: typeof expectedJwtHeader;
  let decodedPayload: AccessTokenPayload;

  try {
    decodedHeader = JSON.parse(decodeBase64Url(encodedHeader)) as typeof expectedJwtHeader;
    decodedPayload = JSON.parse(decodeBase64Url(encodedPayload)) as AccessTokenPayload;
  } catch {
    return null;
  }

  if (decodedHeader.alg !== expectedJwtHeader.alg || decodedHeader.typ !== expectedJwtHeader.typ) {
    return null;
  }

  if (!decodedPayload.sub || !decodedPayload.email || !decodedPayload.name) {
    return null;
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);
  if (decodedPayload.exp <= nowInSeconds) {
    return null;
  }

  return decodedPayload;
}

export function toAuthUserFromTokenPayload(payload: AccessTokenPayload): AuthUser {
  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name,
  };
}
