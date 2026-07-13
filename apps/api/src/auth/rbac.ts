import { Request, Response, NextFunction } from 'express';
import { UserRole, err, HTTP_STATUS, ERROR_CODES } from '@crytonet/shared';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userRole?: UserRole;
      userId?: string;
    }
  }
}

const ROLE_HIERARCHY: Record<UserRole, number> = {
  viewer: 1,
  analyst: 2,
  admin: 3,
  super_admin: 4,
};

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRole = req.userRole;
    if (!userRole) {
      res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json(err(ERROR_CODES.UNAUTHORIZED, 'Authentication required'));
      return;
    }
    const hasPermission = roles.some(
      (required) => ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[required],
    );
    if (!hasPermission) {
      res
        .status(HTTP_STATUS.FORBIDDEN)
        .json(
          err(
            ERROR_CODES.FORBIDDEN,
            `Required role: ${roles.join(' or ')}. Your role: ${userRole}`,
          ),
        );
      return;
    }
    next();
  };
}
