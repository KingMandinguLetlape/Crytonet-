import { Request, Response, NextFunction } from 'express';
import { err, HTTP_STATUS, ERROR_CODES } from '@crytonet/shared';
import { verifyHmacSignature } from './crypto';

export function hmacMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const signature = req.headers['x-signature'] as string | undefined;
  if (!signature) {
    res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json(err(ERROR_CODES.INVALID_SIGNATURE, 'X-Signature header is required'));
    return;
  }

  const secret = process.env.HMAC_SECRET ?? '';
  const rawBody = JSON.stringify(req.body);

  if (!verifyHmacSignature(rawBody, signature, secret)) {
    res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json(err(ERROR_CODES.INVALID_SIGNATURE, 'Invalid HMAC signature'));
    return;
  }

  next();
}
