import { Router, Request, Response } from 'express';
import { ok } from '@crytonet/shared';
import { apiKeyAuth } from '../auth/apiKeyMiddleware';
import { getAllRules } from '../rules/ruleEngine';

export const rulesRouter = Router();

// GET /api/v1/rules
rulesRouter.get('/', apiKeyAuth, (_req: Request, res: Response) => {
  const rules = getAllRules().map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    severity: r.severity,
    action: r.action,
    enabled: r.enabled,
  }));
  res.json(ok(rules));
});
