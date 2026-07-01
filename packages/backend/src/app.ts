import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import { createAuthRouter } from './modules/auth/auth.routes';
import { createWorkspaceRouter } from './modules/workspaces/workspace.routes';
import { createAdminRouter } from './modules/admin/admin.routes';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:5173',
      credentials: true,
    }),
  );
  app.use(express.json());

  app.use(
    session({
      secret: process.env['JWT_SECRET'] ?? 'dev-session-secret',
      resave: false,
      saveUninitialized: false,
      cookie: { secure: process.env['NODE_ENV'] === 'production', httpOnly: true },
    }),
  );
  app.use(passport.initialize());

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/api/auth', createAuthRouter());
  app.use('/api/workspaces', createWorkspaceRouter());
  app.use('/api/admin', createAdminRouter());

  return app;
}
