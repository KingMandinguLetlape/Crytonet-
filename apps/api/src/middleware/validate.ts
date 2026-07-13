import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { err, HTTP_STATUS, ERROR_CODES } from '@crytonet/shared';

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(HTTP_STATUS.UNPROCESSABLE).json(
        err(
          ERROR_CODES.VALIDATION_ERROR,
          'Request validation failed',
          result.error.flatten(),
        ),
      );
      return;
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      res.status(HTTP_STATUS.UNPROCESSABLE).json(
        err(
          ERROR_CODES.VALIDATION_ERROR,
          'Query validation failed',
          result.error.flatten(),
        ),
      );
      return;
    }
    req.query = result.data as typeof req.query;
    next();
  };
}
