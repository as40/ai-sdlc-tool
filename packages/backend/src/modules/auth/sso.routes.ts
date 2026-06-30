import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth.middleware';
import { requireRole } from '../../middleware/require-role.middleware';
import {
  getSsoConfigController,
  oidcCallbackController,
  oidcInitiateController,
  samlCallbackController,
  samlInitiateController,
  saveSsoConfigController,
} from './sso.controller';

export function createSsoRouter(): Router {
  const router = Router();

  // OIDC flow
  router.get('/oidc', oidcInitiateController);
  router.get('/oidc/callback', oidcCallbackController);

  // SAML flow
  router.post('/saml', samlInitiateController);
  router.post('/saml/callback', samlCallbackController);

  // Admin config — SUPER_ADMIN only
  router.get('/sso/config', requireAuth, requireRole('SUPER_ADMIN'), getSsoConfigController);
  router.post('/sso/config', requireAuth, requireRole('SUPER_ADMIN'), saveSsoConfigController);

  return router;
}
