import type { Request, Response, NextFunction } from 'express';
import type { UserRole } from '../modules/auth/auth.types';

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
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
