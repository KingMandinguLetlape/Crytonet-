import { Request, Response } from 'express';
import { err, HTTP_STATUS } from '@crytonet/shared';

export function notFound(_req: Request, res: Response): void {
  res.status(HTTP_STATUS.NOT_FOUND).json(err('NOT_FOUND', 'Route not found'));
}
