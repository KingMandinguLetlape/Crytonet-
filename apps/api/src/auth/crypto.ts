import crypto from 'crypto';

const SALT = process.env.API_KEY_SALT ?? 'default-salt';

export function hashApiKey(rawKey: string): string {
  return crypto.createHmac('sha256', SALT).update(rawKey).digest('hex');
}

export function generateApiKey(): string {
  return `ck_${crypto.randomBytes(32).toString('hex')}`;
}

export function verifyHmacSignature(
  body: string,
  signature: string,
  secret: string,
): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expected, 'hex'),
    );
  } catch {
    return false;
  }
}

export function generateJwt(payload: Record<string, unknown>, secret: string, expiresIn = '24h'): string {
  // Simple JWT implementation using jsonwebtoken
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const jwt = require('jsonwebtoken') as typeof import('jsonwebtoken');
  return jwt.sign(payload, secret, { expiresIn } as import('jsonwebtoken').SignOptions);
}

export function verifyJwt(token: string, secret: string): Record<string, unknown> | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const jwt = require('jsonwebtoken') as typeof import('jsonwebtoken');
    return jwt.verify(token, secret) as Record<string, unknown>;
  } catch {
    return null;
  }
}
