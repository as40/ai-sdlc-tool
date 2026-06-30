import { Router } from 'express';
import { mockLoginController } from './auth.controller';
import { createSsoRouter } from './sso.routes';

export function createAuthRouter(): Router {
  const router = Router();
  router.post('/mock-login', mockLoginController);
  router.use('/', createSsoRouter());
  return router;
}
