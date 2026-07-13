// Re-export rule engine from API for use in worker
// This avoids duplicating the logic while keeping the worker package self-contained.
export { evaluateEvent, getAllRules, getRuleById } from '../../api/src/rules/ruleEngine';
export type { OracodeRuleInstance, RuleContext, EvaluationResult } from '../../api/src/rules/rules';
