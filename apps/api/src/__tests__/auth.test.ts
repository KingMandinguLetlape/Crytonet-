import crypto from 'crypto';
import { hashApiKey, verifyHmacSignature, generateApiKey } from '../auth/crypto';

describe('hashApiKey', () => {
  it('returns a hex string', () => {
    const hash = hashApiKey('test-key');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is deterministic', () => {
    expect(hashApiKey('my-key')).toBe(hashApiKey('my-key'));
  });

  it('produces different hashes for different keys', () => {
    expect(hashApiKey('key-a')).not.toBe(hashApiKey('key-b'));
  });
});

describe('generateApiKey', () => {
  it('starts with ck_', () => {
    expect(generateApiKey()).toMatch(/^ck_/);
  });

  it('generates unique keys', () => {
    const keys = new Set(Array.from({ length: 100 }, generateApiKey));
    expect(keys.size).toBe(100);
  });
});

describe('verifyHmacSignature', () => {
  const secret = 'test-hmac-secret';

  function signBody(body: string): string {
    return crypto.createHmac('sha256', secret).update(body).digest('hex');
  }

  it('returns true for a valid signature', () => {
    const body = JSON.stringify({ event: 'login_failed' });
    const sig = signBody(body);
    expect(verifyHmacSignature(body, sig, secret)).toBe(true);
  });

  it('returns false for an invalid signature', () => {
    const body = JSON.stringify({ event: 'login_failed' });
    expect(verifyHmacSignature(body, 'deadbeef'.repeat(8), secret)).toBe(false);
  });

  it('returns false when body is tampered', () => {
    const original = JSON.stringify({ event: 'login_failed' });
    const sig = signBody(original);
    const tampered = JSON.stringify({ event: 'admin_access' });
    expect(verifyHmacSignature(tampered, sig, secret)).toBe(false);
  });

  it('returns false for malformed signature', () => {
    expect(verifyHmacSignature('body', 'not-hex', secret)).toBe(false);
  });
});
