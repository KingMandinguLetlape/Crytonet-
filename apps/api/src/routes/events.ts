import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { ok } from '@crytonet/shared';
import { validateBody } from '../middleware/validate';
import { apiKeyAuth } from '../auth/apiKeyMiddleware';
import { getQueue } from '../services/queue';
import { db } from '../services/db';

export const eventsRouter = Router();

const CreateEventSchema = z.object({
  type: z.enum([
    'login_failed',
    'login_success',
    'api_request',
    'data_download',
    'privilege_access',
    'session_activity',
    'user_action',
  ]),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  sourceIp: z.string().ip(),
  userId: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  timestamp: z.string().datetime().optional(),
});

const QuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  type: z
    .enum([
      'login_failed',
      'login_success',
      'api_request',
      'data_download',
      'privilege_access',
      'session_activity',
      'user_action',
    ])
    .optional(),
});

// POST /api/v1/events
eventsRouter.post(
  '/',
  apiKeyAuth,
  validateBody(CreateEventSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body as z.infer<typeof CreateEventSchema>;
      const tenantId: string = (req as Request & { tenantId: string }).tenantId;

      const event = await db.securityEvent.create({
        data: {
          id: uuidv4(),
          tenantId,
          type: body.type,
          severity: body.severity,
          sourceIp: body.sourceIp,
          userId: body.userId ?? null,
          metadata: body.metadata,
          timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
          processed: false,
        },
      });

      // Enqueue for async rule evaluation
      const queue = getQueue('security-events');
      await queue.add('evaluate', { eventId: event.id, tenantId }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      });

      res.status(201).json(ok(event));
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/v1/events
eventsRouter.get(
  '/',
  apiKeyAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = QuerySchema.parse(req.query);
      const tenantId: string = (req as Request & { tenantId: string }).tenantId;

      const where = {
        tenantId,
        ...(query.severity ? { severity: query.severity } : {}),
        ...(query.type ? { type: query.type } : {}),
      };

      const [events, total] = await Promise.all([
        db.securityEvent.findMany({
          where,
          orderBy: { timestamp: 'desc' },
          skip: (query.page - 1) * query.limit,
          take: query.limit,
        }),
        db.securityEvent.count({ where }),
      ]);

      res.json(ok(events, { page: query.page, limit: query.limit, total }));
    } catch (err) {
      next(err);
    }
  },
);
