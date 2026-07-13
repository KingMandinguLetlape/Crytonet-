import type { SecurityEventPayload, RuleDecision, Severity, RuleAction } from './index';

// ─── Rule interface ────────────────────────────────────────────────────────
export interface OracodeRuleInstance {
  id: string;
  name: string;
  description: string;
  severity: Severity;
  action: RuleAction;
  enabled: boolean;
  evaluate(event: SecurityEventPayload, context: RuleContext): EvaluationResult;
}

// ─── Context passed to each rule ──────────────────────────────────────────
export interface RuleContext {
  /** Recent events for the same tenant (last 10 min window, pre-fetched) */
  recentEvents: SecurityEventPayload[];
  /** Current timestamp */
  now: Date;
}

// ─── Result returned by evaluate() ────────────────────────────────────────
export interface EvaluationResult {
  triggered: boolean;
  action: RuleAction;
  reason: string;
  metadata: Record<string, unknown>;
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function minutesAgo(minutes: number, from: Date): Date {
  return new Date(from.getTime() - minutes * 60 * 1000);
}

function eventsInWindow(
  events: SecurityEventPayload[],
  type: string,
  windowMinutes: number,
  now: Date,
): SecurityEventPayload[] {
  const cutoff = minutesAgo(windowMinutes, now);
  return events.filter(
    (e) => e.type === type && new Date(e.timestamp) >= cutoff,
  );
}

// ─── RULE_001 – Brute Force Detection ─────────────────────────────────────
export const RULE_001: OracodeRuleInstance = {
  id: 'RULE_001',
  name: 'Brute Force Detection',
  description: 'Blocks when >5 failed logins from the same IP within 5 minutes.',
  severity: 'high',
  action: 'block',
  enabled: true,
  evaluate(event, ctx) {
    if (event.type !== 'login_failed') {
      return { triggered: false, action: 'allow', reason: 'Not a login_failed event', metadata: {} };
    }
    const window = eventsInWindow(ctx.recentEvents, 'login_failed', 5, ctx.now).filter(
      (e) => e.sourceIp === event.sourceIp,
    );
    const count = window.length + 1;
    if (count > 5) {
      return {
        triggered: true,
        action: 'block',
        reason: `Brute force detected: ${count} failed logins from ${event.sourceIp} in 5 minutes`,
        metadata: { failedAttempts: count, sourceIp: event.sourceIp, windowMinutes: 5 },
      };
    }
    return { triggered: false, action: 'allow', reason: `Only ${count} failed logins in window`, metadata: { count } };
  },
};

// ─── RULE_002 – Impossible Travel ─────────────────────────────────────────
export const RULE_002: OracodeRuleInstance = {
  id: 'RULE_002',
  name: 'Impossible Travel',
  description: 'Alerts when a user logs in from 2 different countries within 1 hour.',
  severity: 'high',
  action: 'alert',
  enabled: true,
  evaluate(event, ctx) {
    if (event.type !== 'login_success' || !event.userId) {
      return { triggered: false, action: 'allow', reason: 'Not a login_success event or no userId', metadata: {} };
    }
    const country = (event.metadata as Record<string, unknown>)['country'] as string | undefined;
    if (!country) {
      return { triggered: false, action: 'allow', reason: 'No country in metadata', metadata: {} };
    }
    const cutoff = minutesAgo(60, ctx.now);
    const recentLogins = ctx.recentEvents.filter(
      (e) =>
        e.type === 'login_success' &&
        e.userId === event.userId &&
        new Date(e.timestamp) >= cutoff,
    );
    const countries = new Set(
      recentLogins
        .map((e) => (e.metadata as Record<string, unknown>)['country'] as string | undefined)
        .filter(Boolean),
    );
    countries.add(country);
    if (countries.size >= 2) {
      return {
        triggered: true,
        action: 'alert',
        reason: `Impossible travel: user ${event.userId} logged in from ${countries.size} countries within 1 hour`,
        metadata: { userId: event.userId, countries: Array.from(countries), windowMinutes: 60 },
      };
    }
    return { triggered: false, action: 'allow', reason: 'No impossible travel detected', metadata: {} };
  },
};

// ─── RULE_003 – Privilege Escalation ──────────────────────────────────────
export const RULE_003: OracodeRuleInstance = {
  id: 'RULE_003',
  name: 'Privilege Escalation',
  description: 'Blocks non-admin roles accessing admin endpoints.',
  severity: 'critical',
  action: 'block',
  enabled: true,
  evaluate(event, _ctx) {
    if (event.type !== 'privilege_access') {
      return { triggered: false, action: 'allow', reason: 'Not a privilege_access event', metadata: {} };
    }
    const role = (event.metadata as Record<string, unknown>)['role'] as string | undefined;
    const endpoint = (event.metadata as Record<string, unknown>)['endpoint'] as string | undefined;
    const isAdminEndpoint = endpoint?.startsWith('/admin') || endpoint?.includes('/admin/');
    const isNonAdmin = role && !['super_admin', 'admin'].includes(role);
    if (isAdminEndpoint && isNonAdmin) {
      return {
        triggered: true,
        action: 'block',
        reason: `Privilege escalation: role "${role}" attempted to access admin endpoint "${endpoint}"`,
        metadata: { role, endpoint, userId: event.userId },
      };
    }
    return { triggered: false, action: 'allow', reason: 'Authorized access', metadata: {} };
  },
};

// ─── RULE_004 – Data Exfiltration ─────────────────────────────────────────
export const RULE_004: OracodeRuleInstance = {
  id: 'RULE_004',
  name: 'Data Exfiltration',
  description: 'Alerts when a user downloads >100 MB within 10 minutes.',
  severity: 'critical',
  action: 'alert',
  enabled: true,
  evaluate(event, ctx) {
    if (event.type !== 'data_download') {
      return { triggered: false, action: 'allow', reason: 'Not a data_download event', metadata: {} };
    }
    const bytesThisEvent = ((event.metadata as Record<string, unknown>)['bytes'] as number) ?? 0;
    const cutoff = minutesAgo(10, ctx.now);
    const recentDownloads = ctx.recentEvents.filter(
      (e) =>
        e.type === 'data_download' &&
        e.userId === event.userId &&
        new Date(e.timestamp) >= cutoff,
    );
    const totalBytes =
      recentDownloads.reduce(
        (sum, e) => sum + (((e.metadata as Record<string, unknown>)['bytes'] as number) ?? 0),
        0,
      ) + bytesThisEvent;
    const MB100 = 100 * 1024 * 1024;
    if (totalBytes > MB100) {
      return {
        triggered: true,
        action: 'alert',
        reason: `Data exfiltration: ${(totalBytes / 1024 / 1024).toFixed(1)} MB downloaded in 10 minutes`,
        metadata: { totalBytes, thresholdBytes: MB100, userId: event.userId, windowMinutes: 10 },
      };
    }
    return { triggered: false, action: 'allow', reason: 'Download within threshold', metadata: { totalBytes } };
  },
};

// ─── RULE_005 – Anomalous API Usage ───────────────────────────────────────
export const RULE_005: OracodeRuleInstance = {
  id: 'RULE_005',
  name: 'Anomalous API Usage',
  description: 'Throttles tenants making >1000 API requests per minute.',
  severity: 'medium',
  action: 'throttle',
  enabled: true,
  evaluate(event, ctx) {
    if (event.type !== 'api_request') {
      return { triggered: false, action: 'allow', reason: 'Not an api_request event', metadata: {} };
    }
    const cutoff = minutesAgo(1, ctx.now);
    const recentRequests = ctx.recentEvents.filter(
      (e) => e.type === 'api_request' && new Date(e.timestamp) >= cutoff,
    );
    const count = recentRequests.length + 1;
    if (count > 1000) {
      return {
        triggered: true,
        action: 'throttle',
        reason: `Anomalous API usage: ${count} requests in the last minute for tenant ${event.tenantId}`,
        metadata: { requestCount: count, threshold: 1000, tenantId: event.tenantId, windowMinutes: 1 },
      };
    }
    return { triggered: false, action: 'allow', reason: `${count} requests in last minute`, metadata: { count } };
  },
};

// ─── RULE_006 – Credential Stuffing ───────────────────────────────────────
export const RULE_006: OracodeRuleInstance = {
  id: 'RULE_006',
  name: 'Credential Stuffing',
  description: 'Blocks when >20 unique user login attempts from the same IP within 5 minutes.',
  severity: 'critical',
  action: 'block',
  enabled: true,
  evaluate(event, ctx) {
    if (event.type !== 'login_failed') {
      return { triggered: false, action: 'allow', reason: 'Not a login_failed event', metadata: {} };
    }
    const cutoff = minutesAgo(5, ctx.now);
    const recentAttempts = ctx.recentEvents.filter(
      (e) =>
        e.type === 'login_failed' &&
        e.sourceIp === event.sourceIp &&
        new Date(e.timestamp) >= cutoff,
    );
    const uniqueUsers = new Set([
      ...recentAttempts.map((e) => e.userId ?? (e.metadata?.['username'] as string | undefined)),
      event.userId ?? (event.metadata as Record<string, unknown>)['username'] as string | undefined,
    ].filter(Boolean));
    if (uniqueUsers.size > 20) {
      return {
        triggered: true,
        action: 'block',
        reason: `Credential stuffing: ${uniqueUsers.size} unique user attempts from ${event.sourceIp} in 5 minutes`,
        metadata: { uniqueUserCount: uniqueUsers.size, sourceIp: event.sourceIp, threshold: 20, windowMinutes: 5 },
      };
    }
    return { triggered: false, action: 'allow', reason: `${uniqueUsers.size} unique users in window`, metadata: { uniqueUserCount: uniqueUsers.size } };
  },
};

// ─── RULE_007 – Session Hijacking ─────────────────────────────────────────
export const RULE_007: OracodeRuleInstance = {
  id: 'RULE_007',
  name: 'Session Hijacking',
  description: 'Terminates sessions used from a different IP or User-Agent mid-session.',
  severity: 'critical',
  action: 'terminate',
  enabled: true,
  evaluate(event, ctx) {
    if (event.type !== 'session_activity') {
      return { triggered: false, action: 'allow', reason: 'Not a session_activity event', metadata: {} };
    }
    const meta = event.metadata as Record<string, unknown>;
    const sessionId = meta['sessionId'] as string | undefined;
    const currentIp = event.sourceIp;
    const currentUa = meta['userAgent'] as string | undefined;
    if (!sessionId) {
      return { triggered: false, action: 'allow', reason: 'No sessionId in metadata', metadata: {} };
    }
    const previousActivity = ctx.recentEvents.find(
      (e) =>
        e.type === 'session_activity' &&
        (e.metadata as Record<string, unknown>)['sessionId'] === sessionId,
    );
    if (!previousActivity) {
      return { triggered: false, action: 'allow', reason: 'No prior session activity to compare', metadata: {} };
    }
    const prevMeta = previousActivity.metadata as Record<string, unknown>;
    const prevIp = previousActivity.sourceIp;
    const prevUa = prevMeta['userAgent'] as string | undefined;
    const ipChanged = prevIp !== currentIp;
    const uaChanged = prevUa && currentUa && prevUa !== currentUa;
    if (ipChanged || uaChanged) {
      return {
        triggered: true,
        action: 'terminate',
        reason: `Session hijacking detected: session ${sessionId} used from different ${ipChanged ? `IP (${prevIp} → ${currentIp})` : `User-Agent`}`,
        metadata: {
          sessionId,
          previousIp: prevIp,
          currentIp,
          previousUserAgent: prevUa,
          currentUserAgent: currentUa,
          ipChanged,
          uaChanged: Boolean(uaChanged),
        },
      };
    }
    return { triggered: false, action: 'allow', reason: 'Session context unchanged', metadata: {} };
  },
};

// ─── Registry of all ORACODE rules ────────────────────────────────────────
const RULE_REGISTRY: OracodeRuleInstance[] = [
  RULE_001,
  RULE_002,
  RULE_003,
  RULE_004,
  RULE_005,
  RULE_006,
  RULE_007,
];

export function getAllRules(): OracodeRuleInstance[] {
  return RULE_REGISTRY;
}

export function getRuleById(id: string): OracodeRuleInstance | undefined {
  return RULE_REGISTRY.find((r) => r.id === id);
}

// ─── Evaluate a single event against all enabled rules ────────────────────
export function evaluateEvent(
  event: SecurityEventPayload,
  eventId: string,
  context: RuleContext,
): RuleDecision[] {
  const decisions: RuleDecision[] = [];

  for (const rule of RULE_REGISTRY) {
    if (!rule.enabled) continue;

    let result: EvaluationResult;
    try {
      result = rule.evaluate(event, context);
    } catch (err) {
      console.error(`[rule-engine] Error evaluating ${rule.id}:`, err);
      continue;
    }

    if (result.triggered) {
      decisions.push({
        ruleId: rule.id,
        eventId,
        tenantId: event.tenantId,
        action: result.action,
        reason: result.reason,
        timestamp: new Date().toISOString(),
        metadata: result.metadata,
      });
    }
  }

  return decisions;
}
