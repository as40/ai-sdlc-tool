import type { Request, Response, NextFunction } from 'express';
import type { AccessLevel } from '../modules/auth/auth.types';

export function requireRole(...roles: AccessLevel[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        status: 401,
        title: 'Unauthorized',
        detail: 'Authentication required.',
      });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        status: 403,
        title: 'Forbidden',
        detail: 'Insufficient privileges.',
      });
      return;
    }
    next();
  };
}
