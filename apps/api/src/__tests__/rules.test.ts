import { SecurityEventPayload } from '@crytonet/shared';
import {
  RULE_001,
  RULE_002,
  RULE_003,
  RULE_004,
  RULE_005,
  RULE_006,
  RULE_007,
} from '../rules/rules';
import { RuleContext } from '../rules/rules';

const NOW = new Date('2024-01-01T12:00:00Z');

function makeContext(recent: SecurityEventPayload[] = []): RuleContext {
  return { recentEvents: recent, now: NOW };
}

function makeEvent(overrides: Partial<SecurityEventPayload> = {}): SecurityEventPayload {
  return {
    tenantId: 'tenant-test',
    type: 'login_failed',
    severity: 'medium',
    sourceIp: '1.2.3.4',
    metadata: {},
    timestamp: NOW.toISOString(),
    ...overrides,
  };
}

// ─── RULE_001 ─────────────────────────────────────────────────────────────
describe('RULE_001 – Brute Force Detection', () => {
  it('does not trigger on non-login_failed events', () => {
    const event = makeEvent({ type: 'api_request' });
    const result = RULE_001.evaluate(event, makeContext());
    expect(result.triggered).toBe(false);
  });

  it('does not trigger when ≤5 failed logins', () => {
    const ip = '1.2.3.4';
    const recent = Array.from({ length: 4 }, () =>
      makeEvent({ type: 'login_failed', sourceIp: ip }),
    );
    const event = makeEvent({ type: 'login_failed', sourceIp: ip });
    const result = RULE_001.evaluate(event, makeContext(recent));
    expect(result.triggered).toBe(false);
  });

  it('triggers when >5 failed logins from same IP in 5 minutes', () => {
    const ip = '1.2.3.4';
    const recent = Array.from({ length: 6 }, () =>
      makeEvent({
        type: 'login_failed',
        sourceIp: ip,
        timestamp: new Date(NOW.getTime() - 2 * 60_000).toISOString(),
      }),
    );
    const event = makeEvent({ type: 'login_failed', sourceIp: ip });
    const result = RULE_001.evaluate(event, makeContext(recent));
    expect(result.triggered).toBe(true);
    expect(result.action).toBe('block');
  });

  it('does not trigger when failed logins are from different IPs', () => {
    const recent = Array.from({ length: 10 }, (_, i) =>
      makeEvent({ type: 'login_failed', sourceIp: `1.2.3.${i + 10}` }),
    );
    const event = makeEvent({ type: 'login_failed', sourceIp: '1.2.3.4' });
    const result = RULE_001.evaluate(event, makeContext(recent));
    expect(result.triggered).toBe(false);
  });

  it('does not trigger when old events are outside window', () => {
    const ip = '5.5.5.5';
    const recent = Array.from({ length: 10 }, () =>
      makeEvent({
        type: 'login_failed',
        sourceIp: ip,
        timestamp: new Date(NOW.getTime() - 10 * 60_000).toISOString(), // 10 min ago (outside 5-min window)
      }),
    );
    const event = makeEvent({ type: 'login_failed', sourceIp: ip });
    const result = RULE_001.evaluate(event, makeContext(recent));
    expect(result.triggered).toBe(false);
  });
});

// ─── RULE_002 ─────────────────────────────────────────────────────────────
describe('RULE_002 – Impossible Travel', () => {
  it('does not trigger on non-login_success events', () => {
    const event = makeEvent({ type: 'api_request' });
    const result = RULE_002.evaluate(event, makeContext());
    expect(result.triggered).toBe(false);
  });

  it('does not trigger on login_success without country', () => {
    const event = makeEvent({ type: 'login_success', userId: 'u1', metadata: {} });
    const result = RULE_002.evaluate(event, makeContext());
    expect(result.triggered).toBe(false);
  });

  it('triggers when user logs in from 2 countries within 1 hour', () => {
    const userId = 'user-123';
    const recent = [
      makeEvent({
        type: 'login_success',
        userId,
        metadata: { country: 'US' },
        timestamp: new Date(NOW.getTime() - 30 * 60_000).toISOString(),
      }),
    ];
    const event = makeEvent({ type: 'login_success', userId, metadata: { country: 'CN' } });
    const result = RULE_002.evaluate(event, makeContext(recent));
    expect(result.triggered).toBe(true);
    expect(result.action).toBe('alert');
  });

  it('does not trigger when logins are from same country', () => {
    const userId = 'user-456';
    const recent = [
      makeEvent({
        type: 'login_success',
        userId,
        metadata: { country: 'US' },
        timestamp: new Date(NOW.getTime() - 20 * 60_000).toISOString(),
      }),
    ];
    const event = makeEvent({ type: 'login_success', userId, metadata: { country: 'US' } });
    const result = RULE_002.evaluate(event, makeContext(recent));
    expect(result.triggered).toBe(false);
  });
});

// ─── RULE_003 ─────────────────────────────────────────────────────────────
describe('RULE_003 – Privilege Escalation', () => {
  it('does not trigger on non-privilege_access events', () => {
    const event = makeEvent({ type: 'api_request' });
    const result = RULE_003.evaluate(event, makeContext());
    expect(result.triggered).toBe(false);
  });

  it('triggers when non-admin accesses admin endpoint', () => {
    const event = makeEvent({
      type: 'privilege_access',
      metadata: { role: 'analyst', endpoint: '/admin/users' },
    });
    const result = RULE_003.evaluate(event, makeContext());
    expect(result.triggered).toBe(true);
    expect(result.action).toBe('block');
  });

  it('does not trigger when admin accesses admin endpoint', () => {
    const event = makeEvent({
      type: 'privilege_access',
      metadata: { role: 'admin', endpoint: '/admin/users' },
    });
    const result = RULE_003.evaluate(event, makeContext());
    expect(result.triggered).toBe(false);
  });

  it('does not trigger when non-admin accesses non-admin endpoint', () => {
    const event = makeEvent({
      type: 'privilege_access',
      metadata: { role: 'viewer', endpoint: '/api/v1/events' },
    });
    const result = RULE_003.evaluate(event, makeContext());
    expect(result.triggered).toBe(false);
  });
});

// ─── RULE_004 ─────────────────────────────────────────────────────────────
describe('RULE_004 – Data Exfiltration', () => {
  const MB = 1024 * 1024;

  it('does not trigger on non-data_download events', () => {
    const event = makeEvent({ type: 'api_request' });
    const result = RULE_004.evaluate(event, makeContext());
    expect(result.triggered).toBe(false);
  });

  it('does not trigger when download is under 100 MB', () => {
    const event = makeEvent({ type: 'data_download', userId: 'u1', metadata: { bytes: 50 * MB } });
    const result = RULE_004.evaluate(event, makeContext());
    expect(result.triggered).toBe(false);
  });

  it('triggers when cumulative downloads exceed 100 MB in 10 minutes', () => {
    const userId = 'user-dl';
    const recent = [
      makeEvent({
        type: 'data_download',
        userId,
        metadata: { bytes: 60 * MB },
        timestamp: new Date(NOW.getTime() - 5 * 60_000).toISOString(),
      }),
    ];
    const event = makeEvent({ type: 'data_download', userId, metadata: { bytes: 50 * MB } });
    const result = RULE_004.evaluate(event, makeContext(recent));
    expect(result.triggered).toBe(true);
    expect(result.action).toBe('alert');
  });
});

// ─── RULE_005 ─────────────────────────────────────────────────────────────
describe('RULE_005 – Anomalous API Usage', () => {
  it('does not trigger on non-api_request events', () => {
    const event = makeEvent({ type: 'login_failed' });
    const result = RULE_005.evaluate(event, makeContext());
    expect(result.triggered).toBe(false);
  });

  it('does not trigger when under 1000 requests/min', () => {
    const recent = Array.from({ length: 500 }, () =>
      makeEvent({ type: 'api_request', timestamp: new Date(NOW.getTime() - 30_000).toISOString() }),
    );
    const event = makeEvent({ type: 'api_request' });
    const result = RULE_005.evaluate(event, makeContext(recent));
    expect(result.triggered).toBe(false);
  });

  it('triggers when over 1000 requests/min', () => {
    const recent = Array.from({ length: 1001 }, () =>
      makeEvent({ type: 'api_request', timestamp: new Date(NOW.getTime() - 30_000).toISOString() }),
    );
    const event = makeEvent({ type: 'api_request' });
    const result = RULE_005.evaluate(event, makeContext(recent));
    expect(result.triggered).toBe(true);
    expect(result.action).toBe('throttle');
  });
});

// ─── RULE_006 ─────────────────────────────────────────────────────────────
describe('RULE_006 – Credential Stuffing', () => {
  it('does not trigger on non-login_failed events', () => {
    const event = makeEvent({ type: 'api_request' });
    const result = RULE_006.evaluate(event, makeContext());
    expect(result.triggered).toBe(false);
  });

  it('triggers when >20 unique users attempted from same IP', () => {
    const ip = '9.9.9.9';
    const recent = Array.from({ length: 21 }, (_, i) =>
      makeEvent({
        type: 'login_failed',
        sourceIp: ip,
        userId: `user-${i}`,
        timestamp: new Date(NOW.getTime() - 2 * 60_000).toISOString(),
      }),
    );
    const event = makeEvent({ type: 'login_failed', sourceIp: ip, userId: 'user-999' });
    const result = RULE_006.evaluate(event, makeContext(recent));
    expect(result.triggered).toBe(true);
    expect(result.action).toBe('block');
  });

  it('does not trigger when ≤20 unique users attempted', () => {
    const ip = '8.8.8.8';
    const recent = Array.from({ length: 10 }, (_, i) =>
      makeEvent({ type: 'login_failed', sourceIp: ip, userId: `user-${i}` }),
    );
    const event = makeEvent({ type: 'login_failed', sourceIp: ip, userId: 'user-11' });
    const result = RULE_006.evaluate(event, makeContext(recent));
    expect(result.triggered).toBe(false);
  });
});

// ─── RULE_007 ─────────────────────────────────────────────────────────────
describe('RULE_007 – Session Hijacking', () => {
  it('does not trigger on non-session_activity events', () => {
    const event = makeEvent({ type: 'api_request' });
    const result = RULE_007.evaluate(event, makeContext());
    expect(result.triggered).toBe(false);
  });

  it('does not trigger when IP and UA are unchanged', () => {
    const sessionId = 'sess-abc';
    const recent = [
      makeEvent({
        type: 'session_activity',
        sourceIp: '10.0.0.1',
        metadata: { sessionId, userAgent: 'Mozilla/5.0' },
        timestamp: new Date(NOW.getTime() - 10 * 60_000).toISOString(),
      }),
    ];
    const event = makeEvent({
      type: 'session_activity',
      sourceIp: '10.0.0.1',
      metadata: { sessionId, userAgent: 'Mozilla/5.0' },
    });
    const result = RULE_007.evaluate(event, makeContext(recent));
    expect(result.triggered).toBe(false);
  });

  it('triggers when IP changes mid-session', () => {
    const sessionId = 'sess-xyz';
    const recent = [
      makeEvent({
        type: 'session_activity',
        sourceIp: '10.0.0.1',
        metadata: { sessionId, userAgent: 'Mozilla/5.0' },
      }),
    ];
    const event = makeEvent({
      type: 'session_activity',
      sourceIp: '55.55.55.55',
      metadata: { sessionId, userAgent: 'Mozilla/5.0' },
    });
    const result = RULE_007.evaluate(event, makeContext(recent));
    expect(result.triggered).toBe(true);
    expect(result.action).toBe('terminate');
  });

  it('triggers when User-Agent changes mid-session', () => {
    const sessionId = 'sess-ua-change';
    const recent = [
      makeEvent({
        type: 'session_activity',
        sourceIp: '10.0.0.1',
        metadata: { sessionId, userAgent: 'Mozilla/5.0 Chrome' },
      }),
    ];
    const event = makeEvent({
      type: 'session_activity',
      sourceIp: '10.0.0.1',
      metadata: { sessionId, userAgent: 'curl/7.88' },
    });
    const result = RULE_007.evaluate(event, makeContext(recent));
    expect(result.triggered).toBe(true);
    expect(result.action).toBe('terminate');
  });

  it('does not trigger when no prior session exists', () => {
    const event = makeEvent({
      type: 'session_activity',
      metadata: { sessionId: 'new-sess', userAgent: 'Mozilla/5.0' },
    });
    const result = RULE_007.evaluate(event, makeContext());
    expect(result.triggered).toBe(false);
  });
});
