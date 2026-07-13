import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ok } from '@crytonet/shared';
import { apiKeyAuth } from '../auth/apiKeyMiddleware';
import { db } from '../services/db';

export const decisionsRouter = Router();

const QuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  ruleId: z.string().optional(),
  action: z.enum(['allow', 'alert', 'block', 'throttle', 'terminate']).optional(),
});

// GET /api/v1/decisions
decisionsRouter.get(
  '/',
  apiKeyAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = QuerySchema.parse(req.query);
      const tenantId: string = (req as Request & { tenantId: string }).tenantId;

      const where = {
        tenantId,
        ...(query.ruleId ? { ruleId: query.ruleId } : {}),
        ...(query.action ? { action: query.action } : {}),
      };

      const [decisions, total] = await Promise.all([
        db.decision.findMany({
          where,
          orderBy: { timestamp: 'desc' },
          skip: (query.page - 1) * query.limit,
          take: query.limit,
          include: { event: { select: { type: true, severity: true, sourceIp: true } } },
        }),
        db.decision.count({ where }),
      ]);

      res.json(ok(decisions, { page: query.page, limit: query.limit, total }));
    } catch (err) {
      next(err);
    }
  },
);
