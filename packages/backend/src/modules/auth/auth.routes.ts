import { Router } from 'express';
import { mockLoginController } from './auth.controller';

export function createAuthRouter(): Router {
  const router = Router();
  router.post('/mock-login', mockLoginController);
  return router;
}
