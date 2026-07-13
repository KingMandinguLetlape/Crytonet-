# Multi-Tenancy & RBAC

CRYTONET is built as a multi-tenant SaaS platform with strict data isolation, API key authentication, and role-based access control.

---

## Tenancy Model

Each **Tenant** represents an independent organization. Data isolation is enforced at every layer:

- **Database**: All tables include a `tenantId` column. Queries always filter by `tenantId`.
- **API**: Every authenticated request resolves a tenant from the API key before accessing data.
- **Worker**: Jobs are tagged with `tenantId` and only load events for that tenant.

### Tenant Schema

```prisma
model Tenant {
  id        String   @id @default(uuid())
  name      String
  slug      String   @unique
  plan      String   // free | starter | pro | enterprise
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Plans

| Plan | Description |
|------|-------------|
| `free` | Limited events/month, basic rules |
| `starter` | Higher limits, all 7 rules |
| `pro` | Custom rules, webhooks, SIEM integration |
| `enterprise` | Unlimited, SLA, dedicated support |

---

## API Key Management

### Architecture

API keys are **never stored in plain text**. The raw key is only shown once at creation time. The database stores an HMAC-SHA256 hash of the key.

```
rawKey = "ck_" + 32 random bytes (hex)
keyHash = HMAC-SHA256(rawKey, API_KEY_SALT)
```

### Key Format

```
ck_<64 hex characters>
```

Example: `ck_a3f8b2...`

### Key Lookup Flow

```
Request with X-Api-Key: ck_...
        │
        ▼
hash(key) → keyHash
        │
        ▼
db.apiKey.findFirst({ where: { keyHash } })
        │
        ├── Not found → 401 INVALID_API_KEY
        ├── Expired → 401 INVALID_API_KEY
        └── Found + active tenant → attach tenantId to request
```

### ApiKey Schema

```prisma
model ApiKey {
  id         String    @id @default(uuid())
  tenantId   String
  name       String
  keyHash    String    @unique
  lastUsedAt DateTime?
  expiresAt  DateTime? // null = never expires
  createdAt  DateTime  @default(now())
}
```

---

## HMAC Request Signing

For high-security endpoints, requests must include an `X-Signature` header:

```
X-Signature: HMAC-SHA256(requestBody, HMAC_SECRET)
```

### Generating a signature (Node.js)

```javascript
const crypto = require('crypto');

function signRequest(body, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(body))
    .digest('hex');
}
```

### Example signed request

```http
POST /api/v1/events
Content-Type: application/json
X-Api-Key: ck_your_key
X-Signature: 3a7f1b...

{"type":"login_failed","severity":"high","sourceIp":"1.2.3.4","metadata":{}}
```

---

## RBAC – Role-Based Access Control

### Roles

| Role | Level | Description |
|------|-------|-------------|
| `super_admin` | 4 | Full platform access, cross-tenant operations |
| `admin` | 3 | Full tenant access, manage users and API keys |
| `analyst` | 2 | Read all data, acknowledge incidents |
| `viewer` | 1 | Read-only access to events and decisions |

### Hierarchy

Roles are hierarchical: a higher-level role has all permissions of lower roles.

```
super_admin (4) > admin (3) > analyst (2) > viewer (1)
```

### Using `requireRole` middleware

```typescript
import { requireRole } from '../auth/rbac';

// Only admin or above
router.delete('/api/v1/incidents/:id', apiKeyAuth, requireRole('admin'), handler);

// Analyst or above
router.post('/api/v1/incidents/:id/acknowledge', apiKeyAuth, requireRole('analyst'), handler);

// Any authenticated user
router.get('/api/v1/events', apiKeyAuth, handler);
```

### PRIVILEGE ESCALATION detection (RULE_003)

RULE_003 automatically detects when a user with `analyst` or `viewer` role attempts to access an admin endpoint at the application level, blocking the request before it reaches the handler.

---

## User Schema

```prisma
model User {
  id           String   @id @default(uuid())
  tenantId     String
  email        String
  passwordHash String   // bcrypt, cost factor 12
  role         String   // viewer | analyst | admin | super_admin
  active       Boolean  @default(true)
  createdAt    DateTime @default(now())

  @@unique([tenantId, email])
}
```

Passwords are hashed with **bcrypt** at cost factor 12. Plain passwords are never stored or logged.

---

## Security Considerations

1. **API key rotation**: Generate a new key and revoke the old one without downtime.
2. **Key expiry**: Set `expiresAt` for short-lived integrations (CI/CD, scripts).
3. **HMAC secrets**: Rotate `HMAC_SECRET` and `API_KEY_SALT` independently. After rotating `API_KEY_SALT`, all existing keys must be re-hashed.
4. **Tenant isolation**: All database queries include `WHERE tenantId = ?`. Cross-tenant queries require `super_admin` role.
5. **Audit logs**: Every decision is appended to the `AuditLog` table. Logs are append-only and never deleted.
