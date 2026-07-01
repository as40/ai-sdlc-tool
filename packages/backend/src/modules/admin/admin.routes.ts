import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth.middleware';
import { requireRole } from '../../middleware/require-role.middleware';

export function createAdminRouter(): Router {
  const router = Router();

  router.get('/users', requireAuth, requireRole('SUPER_ADMIN'), (_req, res) =>
    res.status(200).json({ ok: true }),
  );

  router.get('/sso', requireAuth, requireRole('SUPER_ADMIN'), (_req, res) =>
    res.status(200).json({ ok: true }),
  );

  return router;
}
