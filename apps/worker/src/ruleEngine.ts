// Re-export rule engine from the shared package
export {
  evaluateEvent,
  getAllRules,
  getRuleById,
} from '@crytonet/shared';
export type { OracodeRuleInstance, RuleContext, EvaluationResult } from '@crytonet/shared';
