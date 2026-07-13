import { SecurityEventPayload, RuleDecision } from '@crytonet/shared';
import { v4 as uuidv4 } from 'uuid';
import {
  OracodeRuleInstance,
  RuleContext,
  EvaluationResult,
  RULE_001,
  RULE_002,
  RULE_003,
  RULE_004,
  RULE_005,
  RULE_006,
  RULE_007,
} from './rules';

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

// ─── Append-only in-memory audit trail (replaces DB for unit tests) ────────
const _auditTrail: Array<RuleDecision & { id: string }> = [];

export function appendToAuditTrail(decision: RuleDecision): void {
  _auditTrail.push({ ...decision, id: uuidv4() });
}

export function getAuditTrail(): Array<RuleDecision & { id: string }> {
  return [..._auditTrail];
}
