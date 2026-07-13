// ─── Severity Levels ───────────────────────────────────────────────────────
export type Severity = 'low' | 'medium' | 'high' | 'critical';

// ─── Rule Actions ──────────────────────────────────────────────────────────
export type RuleAction = 'allow' | 'alert' | 'block' | 'throttle' | 'terminate';

// ─── Event Types ───────────────────────────────────────────────────────────
export type EventType =
  | 'login_failed'
  | 'login_success'
  | 'api_request'
  | 'data_download'
  | 'privilege_access'
  | 'session_activity'
  | 'user_action';

// ─── Tenant Plans ──────────────────────────────────────────────────────────
export type TenantPlan = 'free' | 'starter' | 'pro' | 'enterprise';

// ─── User Roles ────────────────────────────────────────────────────────────
export type UserRole = 'super_admin' | 'admin' | 'analyst' | 'viewer';

// ─── Incident Status ───────────────────────────────────────────────────────
export type IncidentStatus = 'open' | 'investigating' | 'resolved' | 'closed';

// ─── Security Event ────────────────────────────────────────────────────────
export interface SecurityEventPayload {
  tenantId: string;
  type: EventType;
  severity: Severity;
  sourceIp: string;
  userId?: string;
  metadata: Record<string, unknown>;
  timestamp: string; // ISO-8601
}

// ─── Rule Decision ─────────────────────────────────────────────────────────
export interface RuleDecision {
  ruleId: string;
  eventId: string;
  tenantId: string;
  action: RuleAction;
  reason: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

// ─── API Response Envelope ─────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

// ─── Pagination ────────────────────────────────────────────────────────────
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ─── ORACODE Rule Definition ───────────────────────────────────────────────
export interface OracodeRule {
  id: string;
  name: string;
  description: string;
  severity: Severity;
  action: RuleAction;
  enabled: boolean;
}

// ─── Constants ─────────────────────────────────────────────────────────────
export const RULE_IDS = {
  BRUTE_FORCE: 'RULE_001',
  IMPOSSIBLE_TRAVEL: 'RULE_002',
  PRIVILEGE_ESCALATION: 'RULE_003',
  DATA_EXFILTRATION: 'RULE_004',
  ANOMALOUS_API: 'RULE_005',
  CREDENTIAL_STUFFING: 'RULE_006',
  SESSION_HIJACKING: 'RULE_007',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
} as const;

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  INVALID_API_KEY: 'INVALID_API_KEY',
  INVALID_SIGNATURE: 'INVALID_SIGNATURE',
  RATE_LIMITED: 'RATE_LIMITED',
} as const;

// ─── Utility: build success response ──────────────────────────────────────
export function ok<T>(data: T, meta?: ApiResponse<T>['meta']): ApiResponse<T> {
  return { success: true, data, ...(meta ? { meta } : {}) };
}

// ─── Utility: build error response ────────────────────────────────────────
export function err(
  code: string,
  message: string,
  details?: unknown,
): ApiResponse<never> {
  return { success: false, error: { code, message, details } };
}

// ─── ORACODE Rule Engine ───────────────────────────────────────────────────
export type {
  OracodeRuleInstance,
  RuleContext,
  EvaluationResult,
} from './ruleEngine';
export {
  RULE_001,
  RULE_002,
  RULE_003,
  RULE_004,
  RULE_005,
  RULE_006,
  RULE_007,
  getAllRules,
  getRuleById,
  evaluateEvent,
} from './ruleEngine';
