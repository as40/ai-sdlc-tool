import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { createAuthRouter } from './modules/auth/auth.routes';

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

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/api/auth', createAuthRouter());

  return app;
}
