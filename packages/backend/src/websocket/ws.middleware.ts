import type { IncomingMessage } from 'node:http';
import jwt from 'jsonwebtoken';

export interface WsTokenPayload {
  userId: string;
  workspaceId?: string;
}

export function authenticateWsRequest(req: IncomingMessage): WsTokenPayload {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not configured');

  let token: string | undefined;

  const authHeader = req.headers['authorization'];
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else if (req.url) {
    const url = new URL(req.url, 'ws://localhost');
    token = url.searchParams.get('token') ?? undefined;
  }

  if (!token) throw new Error('No authentication token provided');

  const raw = jwt.verify(token, secret) as Record<string, unknown>;

  const userId =
    typeof raw['userId'] === 'string'
      ? raw['userId']
      : typeof raw['sub'] === 'string'
        ? raw['sub']
        : undefined;

  if (!userId) throw new Error('Token missing userId claim');

  const workspaceId = typeof raw['workspaceId'] === 'string' ? raw['workspaceId'] : undefined;

  return { userId, workspaceId };
}
