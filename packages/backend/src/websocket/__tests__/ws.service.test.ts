import { createServer } from 'node:http';
import type { Server } from 'node:http';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { WebSocketService } from '../ws.service';

const TEST_SECRET = 'test-secret-key-for-ws-tests';
const TEST_USER_ID = 'user-abc';
const TEST_WORKSPACE_ID = 'workspace-xyz';

function makeToken(userId: string, workspaceId?: string): string {
  return jwt.sign({ userId, workspaceId }, TEST_SECRET, { expiresIn: '1h' });
}

function connectClient(port: number, token?: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const url = token ? `ws://localhost:${port}?token=${token}` : `ws://localhost:${port}`;
    const ws = new WebSocket(url);
    ws.once('open', () => resolve(ws));
    ws.once('error', reject);
  });
}

function nextMessage(ws: WebSocket): Promise<unknown> {
  return new Promise((resolve, reject) => {
    ws.once('message', (data) => {
      try {
        resolve(JSON.parse(data.toString()));
      } catch (e) {
        reject(e);
      }
    });
    ws.once('error', reject);
  });
}

function nextClose(ws: WebSocket): Promise<{ code: number; reason: string }> {
  return new Promise((resolve) => {
    ws.once('close', (code, reason) => resolve({ code, reason: reason.toString() }));
  });
}

describe('WebSocketService', () => {
  let server: Server;
  let service: WebSocketService;
  let port: number;

  beforeEach(() => {
    process.env['JWT_SECRET'] = TEST_SECRET;

    server = createServer();
    service = new WebSocketService(server, 999_999);

    return new Promise<void>((resolve) => {
      server.listen(0, () => {
        const addr = server.address();
        port = typeof addr === 'object' && addr !== null ? addr.port : 0;
        resolve();
      });
    });
  });

  afterEach(async () => {
    await service.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    delete process.env['JWT_SECRET'];
  });

  describe('broadcast', () => {
    it('sends typed event to the correct user connection', async () => {
      const token = makeToken(TEST_USER_ID);
      const client = await connectClient(port, token);

      const event = {
        type: 'workflow:update',
        payload: { workflowId: 'wf-1', status: 'running' },
        timestamp: new Date().toISOString(),
      };

      const received = nextMessage(client);
      service.broadcast(TEST_USER_ID, event);
      const msg = await received;

      expect(msg).toEqual(event);
      client.close();
    });

    it('does not send to a different user', async () => {
      const token = makeToken(TEST_USER_ID);
      const client = await connectClient(port, token);

      const sendSpy = vi.fn();
      client.on('message', sendSpy);

      service.broadcast('other-user', {
        type: 'workflow:update',
        payload: { workflowId: 'wf-1', status: 'running' },
        timestamp: new Date().toISOString(),
      });

      // Give a tick for any inadvertent delivery
      await new Promise((r) => setTimeout(r, 30));
      expect(sendSpy).not.toHaveBeenCalled();
      client.close();
    });
  });

  describe('broadcastToWorkspace', () => {
    it('sends event to all users in the workspace', async () => {
      const token1 = makeToken('user-1', TEST_WORKSPACE_ID);
      const token2 = makeToken('user-2', TEST_WORKSPACE_ID);

      const [client1, client2] = await Promise.all([
        connectClient(port, token1),
        connectClient(port, token2),
      ]);

      const event = {
        type: 'vectorization:progress' as const,
        payload: { progress: 50, repositoryId: 'repo-1' },
        timestamp: new Date().toISOString(),
      };

      const [msg1, msg2] = await Promise.all([
        nextMessage(client1),
        nextMessage(client2),
        Promise.resolve(service.broadcastToWorkspace(TEST_WORKSPACE_ID, event)),
      ]);

      expect(msg1).toEqual(event);
      expect(msg2).toEqual(event);
      client1.close();
      client2.close();
    });
  });

  describe('ping/pong', () => {
    it('responds to ping with pong', async () => {
      const token = makeToken(TEST_USER_ID);
      const client = await connectClient(port, token);

      const received = nextMessage(client);
      client.send(JSON.stringify({ type: 'ping' }));
      const msg = (await received) as { type: string; payload: unknown; timestamp: string };

      expect(msg.type).toBe('pong');
      expect(typeof msg.timestamp).toBe('string');
      client.close();
    });
  });

  describe('authentication', () => {
    it('rejects unauthenticated connections with close code 4401', async () => {
      const client = new WebSocket(`ws://localhost:${port}`);
      const { code } = await nextClose(client);
      expect(code).toBe(4401);
    });

    it('rejects connections with an invalid token', async () => {
      const client = new WebSocket(`ws://localhost:${port}?token=not-a-valid-jwt`);
      const { code } = await nextClose(client);
      expect(code).toBe(4401);
    });

    it('accepts connections with a valid Bearer token in Authorization header', async () => {
      const token = makeToken(TEST_USER_ID);
      return new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(`ws://localhost:${port}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        ws.once('open', () => {
          ws.close();
          resolve();
        });
        ws.once('error', reject);
      });
    });
  });

  describe('heartbeat cleanup', () => {
    it('terminates and removes dead connections on heartbeat run', async () => {
      const token = makeToken(TEST_USER_ID);
      const client = await connectClient(port, token);

      // Confirm connection is registered
      await new Promise((r) => setTimeout(r, 20));
      expect(service._getConnectionCount(TEST_USER_ID)).toBe(1);

      // Simulate a dead socket: isAlive is still true from connection setup.
      // First heartbeat tick: marks isAlive=false, sends ping.
      service._runHeartbeat();
      // Second heartbeat tick: isAlive still false (no pong from mock dead socket) → terminate.
      // However the client IS alive and will respond to pings via ws auto-pong.
      // To simulate a truly dead socket, we prevent pong by destroying the underlying socket.
      // Destroying the raw socket causes the server to fire 'close', which removes it via removeConnection.
      // Instead, test the heartbeat logic directly with a mock socket:

      // Inject a mock dead socket into the internal map
      const mockDeadSocket = {
        isAlive: false,
        userId: 'dead-user',
        readyState: WebSocket.OPEN,
        terminate: vi.fn(),
        ping: vi.fn(),
        send: vi.fn(),
      };

      const svc = service as unknown as {
        userConnections: Map<string, Set<typeof mockDeadSocket>>;
      };
      svc.userConnections.set('dead-user', new Set([mockDeadSocket]));
      expect(service._getConnectionCount('dead-user')).toBe(1);

      service._runHeartbeat();

      expect(mockDeadSocket.terminate).toHaveBeenCalledOnce();
      expect(service._getConnectionCount('dead-user')).toBe(0);

      client.close();
    });

    it('marks live connections as isAlive=false and sends ping on heartbeat', async () => {
      const token = makeToken(TEST_USER_ID);
      await connectClient(port, token);
      await new Promise((r) => setTimeout(r, 20));

      const mockAliveSocket = {
        isAlive: true,
        userId: 'alive-user',
        readyState: WebSocket.OPEN,
        terminate: vi.fn(),
        ping: vi.fn(),
        send: vi.fn(),
      };

      const svc = service as unknown as {
        userConnections: Map<string, Set<typeof mockAliveSocket>>;
      };
      svc.userConnections.set('alive-user', new Set([mockAliveSocket]));

      service._runHeartbeat();

      expect(mockAliveSocket.terminate).not.toHaveBeenCalled();
      expect(mockAliveSocket.ping).toHaveBeenCalledOnce();
      expect(mockAliveSocket.isAlive).toBe(false);
    });
  });
});
