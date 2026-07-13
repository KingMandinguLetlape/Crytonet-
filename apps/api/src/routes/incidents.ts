import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ok } from '@crytonet/shared';
import { apiKeyAuth } from '../auth/apiKeyMiddleware';
import { db } from '../services/db';

export const incidentsRouter = Router();

const QuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['open', 'investigating', 'resolved', 'closed']).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
});

// GET /api/v1/incidents
incidentsRouter.get(
  '/',
  apiKeyAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = QuerySchema.parse(req.query);
      const tenantId: string = (req as Request & { tenantId: string }).tenantId;

      const where = {
        tenantId,
        ...(query.status ? { status: query.status } : {}),
        ...(query.severity ? { severity: query.severity } : {}),
      };

      const [incidents, total] = await Promise.all([
        db.incident.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (query.page - 1) * query.limit,
          take: query.limit,
          include: {
            assignee: { select: { id: true, email: true, role: true } },
          },
        }),
        db.incident.count({ where }),
      ]);

      res.json(ok(incidents, { page: query.page, limit: query.limit, total }));
    } catch (err) {
      next(err);
    }
  },
);
