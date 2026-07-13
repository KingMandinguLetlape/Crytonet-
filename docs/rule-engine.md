# ORACODE Rule Engine

ORACODE (Operational Rule-Activated Cybersecurity Detection Engine) is CRYTONET's core threat detection framework.

---

## How It Works

1. A **SecurityEvent** is ingested via `POST /api/v1/events`
2. The event is saved to the database and pushed to the `security-events` BullMQ queue
3. The **worker** picks up the job, loads recent events as context, and runs the event through all enabled rules
4. Each rule returns an **EvaluationResult** (`triggered: boolean`, `action`, `reason`, `metadata`)
5. Triggered rules produce **Decisions** saved to the database and an **AuditLog** entry

```
SecurityEvent
      │
      ▼
  [BullMQ Queue]
      │
      ▼
  [Worker Processor]
      │
      ├─► RULE_001.evaluate(event, context) → Decision?
      ├─► RULE_002.evaluate(event, context) → Decision?
      │   ...
      └─► RULE_007.evaluate(event, context) → Decision?
              │
              ▼
      [DB: Decision + AuditLog]
```

---

## Rule Interface

Each rule implements:

```typescript
interface OracodeRuleInstance {
  id: string;           // e.g. "RULE_001"
  name: string;
  description: string;
  severity: Severity;   // low | medium | high | critical
  action: RuleAction;   // allow | alert | block | throttle | terminate
  enabled: boolean;
  evaluate(event: SecurityEventPayload, context: RuleContext): EvaluationResult;
}

interface RuleContext {
  recentEvents: SecurityEventPayload[]; // events in last 10-min window
  now: Date;
}

interface EvaluationResult {
  triggered: boolean;
  action: RuleAction;
  reason: string;
  metadata: Record<string, unknown>;
}
```

---

## Rules Reference

### RULE_001 – Brute Force Detection

| Property | Value |
|----------|-------|
| Severity | `high` |
| Action | `block` |
| Event type | `login_failed` |

**Logic:** Count `login_failed` events from the same `sourceIp` in the last **5 minutes**. If count > 5, trigger.

**Metadata passed:**
```json
{
  "failedAttempts": 7,
  "sourceIp": "203.0.113.1",
  "windowMinutes": 5
}
```

---

### RULE_002 – Impossible Travel

| Property | Value |
|----------|-------|
| Severity | `high` |
| Action | `alert` |
| Event type | `login_success` |

**Logic:** Find `login_success` events for the same `userId` in the last **60 minutes**. If the set of `metadata.country` values has ≥ 2 distinct entries, trigger.

**Required metadata fields:**
```json
{ "country": "US" }
```

---

### RULE_003 – Privilege Escalation

| Property | Value |
|----------|-------|
| Severity | `critical` |
| Action | `block` |
| Event type | `privilege_access` |

**Logic:** If `metadata.endpoint` starts with `/admin` and `metadata.role` is not `admin` or `super_admin`, trigger.

**Required metadata fields:**
```json
{ "role": "analyst", "endpoint": "/admin/users" }
```

---

### RULE_004 – Data Exfiltration

| Property | Value |
|----------|-------|
| Severity | `critical` |
| Action | `alert` |
| Event type | `data_download` |

**Logic:** Sum `metadata.bytes` for all `data_download` events by the same `userId` in the last **10 minutes**. If total > 100 MB (104,857,600 bytes), trigger.

**Required metadata fields:**
```json
{ "bytes": 60000000 }
```

---

### RULE_005 – Anomalous API Usage

| Property | Value |
|----------|-------|
| Severity | `medium` |
| Action | `throttle` |
| Event type | `api_request` |

**Logic:** Count all `api_request` events for the tenant in the last **1 minute**. If count > 1000, trigger.

---

### RULE_006 – Credential Stuffing

| Property | Value |
|----------|-------|
| Severity | `critical` |
| Action | `block` |
| Event type | `login_failed` |

**Logic:** Count unique `userId` (or `metadata.username`) values across `login_failed` events from the same `sourceIp` in the last **5 minutes**. If unique count > 20, trigger.

---

### RULE_007 – Session Hijacking

| Property | Value |
|----------|-------|
| Severity | `critical` |
| Action | `terminate` |
| Event type | `session_activity` |

**Logic:** Find the most recent prior `session_activity` event with the same `metadata.sessionId`. If the `sourceIp` or `metadata.userAgent` differs, trigger.

**Required metadata fields:**
```json
{ "sessionId": "sess-abc123", "userAgent": "Mozilla/5.0 Chrome/120" }
```

---

## Decision Actions

| Action | Description |
|--------|-------------|
| `allow` | Rule did not trigger; request proceeds normally |
| `alert` | Suspicious activity detected; logged and notified |
| `block` | Request blocked; IP/user flagged |
| `throttle` | Rate limiting applied to tenant/IP |
| `terminate` | Active session terminated immediately |

---

## Audit Trail

Every triggered decision creates an **AuditLog** entry:

```json
{
  "actorId": "system",
  "actorType": "system",
  "action": "RULE_TRIGGERED:RULE_001:block",
  "resourceType": "SecurityEvent",
  "resourceId": "evt-uuid",
  "metadata": {
    "ruleId": "RULE_001",
    "action": "block",
    "reason": "Brute force detected..."
  }
}
```

---

## Extending Rules

To add a new rule:

1. Create a new `OracodeRuleInstance` in `apps/api/src/rules/rules.ts`
2. Register it in `apps/api/src/rules/ruleEngine.ts` under `RULE_REGISTRY`
3. Add tests in `apps/api/src/__tests__/rules.test.ts`

```typescript
export const RULE_008: OracodeRuleInstance = {
  id: 'RULE_008',
  name: 'My New Rule',
  description: 'Detects ...',
  severity: 'high',
  action: 'alert',
  enabled: true,
  evaluate(event, ctx) {
    if (event.type !== 'my_event_type') {
      return { triggered: false, action: 'allow', reason: 'Wrong type', metadata: {} };
    }
    // ... detection logic
    return { triggered: true, action: 'alert', reason: 'Detected!', metadata: {} };
  },
};
```
