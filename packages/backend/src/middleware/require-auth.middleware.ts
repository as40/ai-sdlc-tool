import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from '../modules/auth/auth.types';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({
      status: 401,
      title: 'Unauthorized',
      detail: 'Missing or malformed Authorization header.',
    });
    return;
  }

  const token = authHeader.slice(7);
  const jwtSecret = process.env['JWT_SECRET'];

  if (!jwtSecret) {
    res.status(500).json({
      status: 500,
      title: 'Internal Server Error',
      detail: 'Server misconfiguration.',
    });
    return;
  }

  try {
    const payload = jwt.verify(token, jwtSecret) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({
      status: 401,
      title: 'Unauthorized',
      detail: 'Invalid or expired token.',
    });
  }
}
