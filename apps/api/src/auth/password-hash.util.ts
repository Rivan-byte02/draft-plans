import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const passwordHashAlgorithm = 'scrypt';
const saltLengthBytes = 16;
const keyLengthBytes = 64;

function encodeBuffer(value: Buffer) {
  return value.toString('base64url');
}

function decodeBuffer(value: string) {
  return Buffer.from(value, 'base64url');
}

export function hashPassword(plainTextPassword: string) {
  const salt = randomBytes(saltLengthBytes);
  const passwordHash = scryptSync(plainTextPassword, salt, keyLengthBytes);

  return `${passwordHashAlgorithm}$${encodeBuffer(salt)}$${encodeBuffer(passwordHash)}`;
}

export function verifyPassword(
  plainTextPassword: string,
  storedPasswordHash: string,
) {
  const [algorithm, encodedSalt, encodedPasswordHash] = storedPasswordHash.split('$');

  if (algorithm !== passwordHashAlgorithm || !encodedSalt || !encodedPasswordHash) {
    return false;
  }

  const salt = decodeBuffer(encodedSalt);
  const expectedPasswordHash = decodeBuffer(encodedPasswordHash);
  const providedPasswordHash = scryptSync(plainTextPassword, salt, expectedPasswordHash.length);

  return timingSafeEqual(providedPasswordHash, expectedPasswordHash);
}
