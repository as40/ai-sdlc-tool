import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth.middleware';
import { requireRole } from '../../middleware/require-role.middleware';
import { workspaceGuard } from '../../middleware/workspace-guard.middleware';
import {
  createWorkspaceController,
  listWorkspacesController,
  getWorkspaceController,
  inviteUserController,
  removeMemberController,
} from './workspace.controller';

export function createWorkspaceRouter(): Router {
  const router = Router();

  router.post('/', requireAuth, createWorkspaceController);
  router.get('/', requireAuth, listWorkspacesController);

  router.get('/:id', requireAuth, workspaceGuard, getWorkspaceController);

  router.post(
    '/:id/invites',
    requireAuth,
    workspaceGuard,
    requireRole('WORKSPACE_OWNER', 'SUPER_ADMIN'),
    inviteUserController,
  );

  router.delete(
    '/:id/members/:userId',
    requireAuth,
    workspaceGuard,
    requireRole('WORKSPACE_OWNER', 'SUPER_ADMIN'),
    removeMemberController,
  );

  // Protected settings stubs (from story 2.3)
  router.get(
    '/:id/settings',
    requireAuth,
    workspaceGuard,
    requireRole('WORKSPACE_OWNER', 'SUPER_ADMIN'),
    (_req, res) => res.status(200).json({ ok: true }),
  );

  router.get(
    '/:id/ai-config',
    requireAuth,
    workspaceGuard,
    requireRole('WORKSPACE_OWNER', 'SUPER_ADMIN'),
    (_req, res) => res.status(200).json({ ok: true }),
  );

  return router;
}
