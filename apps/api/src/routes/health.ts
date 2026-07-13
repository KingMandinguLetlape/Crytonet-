import { Router, Request, Response } from 'express';
import { ok } from '@crytonet/shared';

export const healthRouter = Router();

healthRouter.get('/', (_req: Request, res: Response) => {
  res.json(
    ok({
      status: 'healthy',
      service: 'crytonet-api',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
    }),
  );
});
