import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { err, HTTP_STATUS, ERROR_CODES } from '@crytonet/shared';

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error('[api] Unhandled error:', error);

  if (error instanceof ZodError) {
    res.status(HTTP_STATUS.UNPROCESSABLE).json(
      err(ERROR_CODES.VALIDATION_ERROR, 'Validation failed', error.flatten()),
    );
    return;
  }

  if (error instanceof Error) {
    const statusCode =
      (error as Error & { statusCode?: number }).statusCode ??
      HTTP_STATUS.INTERNAL_ERROR;

    res.status(statusCode).json(
      err(
        ERROR_CODES.INTERNAL_ERROR,
        process.env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : error.message,
      ),
    );
    return;
  }

  res
    .status(HTTP_STATUS.INTERNAL_ERROR)
    .json(err(ERROR_CODES.INTERNAL_ERROR, 'An unexpected error occurred'));
}
