# CRYTONET REST API Reference

Base URL: `http://localhost:3001`

All endpoints (except `/health`) require authentication via the `X-Api-Key` header.

---

## Authentication

### API Key Authentication

Include your API key in every request:

```http
X-Api-Key: ck_your_api_key_here
```

### HMAC Request Signing (optional, high-security routes)

For routes that require HMAC verification, include the `X-Signature` header:

```
X-Signature: <HMAC-SHA256 hex of request body using your HMAC_SECRET>
```

---

## Error Responses

All errors follow this envelope:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {}
  }
}
```

| HTTP Status | Code | Description |
|-------------|------|-------------|
| 400 | `VALIDATION_ERROR` | Request body failed validation |
| 401 | `UNAUTHORIZED` | Missing or invalid API key |
| 401 | `INVALID_API_KEY` | API key not found or expired |
| 401 | `INVALID_SIGNATURE` | HMAC signature mismatch |
| 403 | `FORBIDDEN` | Insufficient role |
| 404 | `NOT_FOUND` | Resource not found |
| 422 | `VALIDATION_ERROR` | Schema validation failed |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

---

## Endpoints

### GET /health

Returns API health status. No authentication required.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "service": "crytonet-api",
    "version": "1.0.0",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "uptime": 3600
  }
}
```

---

### POST /api/v1/events

Ingest a security event. The event is stored in the database and queued for rule evaluation.

**Request Headers:**
```
X-Api-Key: ck_your_key
Content-Type: application/json
```

**Request Body:**
```json
{
  "type": "login_failed",
  "severity": "high",
  "sourceIp": "203.0.113.1",
  "userId": "user-abc123",
  "metadata": {
    "country": "CN",
    "username": "alice"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `enum` | ✅ | `login_failed`, `login_success`, `api_request`, `data_download`, `privilege_access`, `session_activity`, `user_action` |
| `severity` | `enum` | ✅ | `low`, `medium`, `high`, `critical` |
| `sourceIp` | `string` | ✅ | Valid IPv4 or IPv6 address |
| `userId` | `string` | ❌ | ID of the user associated with the event |
| `metadata` | `object` | ❌ | Rule-specific context data (see rule docs) |
| `timestamp` | `ISO-8601` | ❌ | Defaults to now |

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "evt-uuid",
    "tenantId": "tenant-uuid",
    "type": "login_failed",
    "severity": "high",
    "sourceIp": "203.0.113.1",
    "userId": "user-abc123",
    "metadata": { "country": "CN" },
    "timestamp": "2024-01-15T10:30:00.000Z",
    "processed": false
  }
}
```

---

### GET /api/v1/events

List security events for the authenticated tenant.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | `number` | Page number (default: 1) |
| `limit` | `number` | Items per page (default: 20, max: 100) |
| `severity` | `enum` | Filter by severity |
| `type` | `enum` | Filter by event type |

**Response 200:**
```json
{
  "success": true,
  "data": [ /* SecurityEvent[] */ ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 143
  }
}
```

---

### GET /api/v1/decisions

List rule decisions for the authenticated tenant.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | `number` | Page number (default: 1) |
| `limit` | `number` | Items per page (default: 20, max: 100) |
| `ruleId` | `string` | Filter by rule ID (e.g. `RULE_001`) |
| `action` | `enum` | Filter by action: `allow`, `alert`, `block`, `throttle`, `terminate` |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "dec-uuid",
      "tenantId": "tenant-uuid",
      "eventId": "evt-uuid",
      "ruleId": "RULE_001",
      "action": "block",
      "reason": "Brute force detected: 6 failed logins from 203.0.113.1 in 5 minutes",
      "metadata": { "failedAttempts": 6 },
      "timestamp": "2024-01-15T10:30:01.000Z",
      "event": {
        "type": "login_failed",
        "severity": "high",
        "sourceIp": "203.0.113.1"
      }
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 47 }
}
```

---

### GET /api/v1/rules

List all ORACODE rules with their current configuration.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "RULE_001",
      "name": "Brute Force Detection",
      "description": "Blocks when >5 failed logins from the same IP within 5 minutes.",
      "severity": "high",
      "action": "block",
      "enabled": true
    }
  ]
}
```

---

### GET /api/v1/incidents

List security incidents for the authenticated tenant.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | `number` | Page number (default: 1) |
| `limit` | `number` | Items per page (default: 20, max: 100) |
| `status` | `enum` | Filter: `open`, `investigating`, `resolved`, `closed` |
| `severity` | `enum` | Filter: `low`, `medium`, `high`, `critical` |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "inc-uuid",
      "tenantId": "tenant-uuid",
      "title": "Brute Force Attack from 203.0.113.1",
      "severity": "high",
      "status": "investigating",
      "assigneeId": "user-uuid",
      "createdAt": "2024-01-15T09:00:00.000Z",
      "resolvedAt": null,
      "assignee": {
        "id": "user-uuid",
        "email": "admin@demo.com",
        "role": "admin"
      }
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 3 }
}
```
