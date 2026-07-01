import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth.middleware';
import { requireRole } from '../../middleware/require-role.middleware';

export function createWorkspaceRouter(): Router {
  const router = Router();

  router.get(
    '/:id/settings',
    requireAuth,
    requireRole('WORKSPACE_OWNER', 'SUPER_ADMIN'),
    (_req, res) => res.status(200).json({ ok: true }),
  );

  router.get(
    '/:id/ai-config',
    requireAuth,
    requireRole('WORKSPACE_OWNER', 'SUPER_ADMIN'),
    (_req, res) => res.status(200).json({ ok: true }),
  );

  return router;
}
