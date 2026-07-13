import { Request, Response, NextFunction } from 'express';
import { err, HTTP_STATUS, ERROR_CODES } from '@crytonet/shared';
import { hashApiKey } from './crypto';
import { db } from '../services/db';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      tenantId: string;
      tenantName: string;
    }
  }
}

export async function apiKeyAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const rawKey =
    req.headers['x-api-key'] as string | undefined ??
    (req.headers['authorization'] as string | undefined)?.replace(/^Bearer\s+/, '');

  if (!rawKey) {
    res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json(err(ERROR_CODES.INVALID_API_KEY, 'API key is required'));
    return;
  }

  const keyHash = hashApiKey(rawKey);

  const apiKey = await db.apiKey.findFirst({
    where: {
      keyHash,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    include: { tenant: true },
  });

  if (!apiKey || !apiKey.tenant.active) {
    res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json(err(ERROR_CODES.INVALID_API_KEY, 'Invalid or expired API key'));
    return;
  }

  // Update lastUsedAt without blocking the response
  db.apiKey
    .update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } })
    .catch((e: unknown) => console.error('[auth] Failed to update lastUsedAt:', e));

  req.tenantId = apiKey.tenant.id;
  req.tenantName = apiKey.tenant.name;
  next();
}
