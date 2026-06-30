import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'node:http';
import type { IncomingMessage } from 'node:http';
import type { WsEvent } from '../types/ws-events';
import { makeEvent } from '../types/ws-events';
import { authenticateWsRequest } from './ws.middleware';
import { IncomingMessageSchema } from './ws.events';

const DEFAULT_HEARTBEAT_INTERVAL = 30_000;

interface ExtendedWebSocket extends WebSocket {
  isAlive: boolean;
  userId: string;
  workspaceId?: string;
}

export class WebSocketService {
  private readonly wss: WebSocketServer;
  private readonly userConnections = new Map<string, Set<ExtendedWebSocket>>();
  private readonly workspaceUsers = new Map<string, Set<string>>();
  private readonly heartbeatTimer: NodeJS.Timeout;

  constructor(server: Server, heartbeatInterval = DEFAULT_HEARTBEAT_INTERVAL) {
    this.wss = new WebSocketServer({ server });
    this.wss.on('connection', (ws: ExtendedWebSocket, req: IncomingMessage) =>
      this.handleConnection(ws, req),
    );
    this.heartbeatTimer = setInterval(() => this.runHeartbeat(), heartbeatInterval);
    this.heartbeatTimer.unref();
  }

  private handleConnection(ws: ExtendedWebSocket, req: IncomingMessage): void {
    let payload: { userId: string; workspaceId?: string };
    try {
      payload = authenticateWsRequest(req);
    } catch {
      ws.close(4401, 'Unauthorized');
      return;
    }

    ws.isAlive = true;
    ws.userId = payload.userId;
    ws.workspaceId = payload.workspaceId;

    this.addConnection(ws);

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (data) => this.handleMessage(ws, data));
    ws.on('close', () => this.removeConnection(ws));
  }

  private handleMessage(ws: ExtendedWebSocket, data: unknown): void {
    let parsed: unknown;
    try {
      const raw = data instanceof Buffer ? data.toString('utf8') : String(data);
      parsed = JSON.parse(raw);
    } catch {
      return;
    }

    const result = IncomingMessageSchema.safeParse(parsed);
    if (!result.success) return;

    if (result.data.type === 'ping') {
      ws.send(JSON.stringify(makeEvent('pong', {})));
    }
  }

  private addConnection(ws: ExtendedWebSocket): void {
    const { userId, workspaceId } = ws;

    const sockets = this.userConnections.get(userId) ?? new Set<ExtendedWebSocket>();
    sockets.add(ws);
    this.userConnections.set(userId, sockets);

    if (workspaceId) {
      const users = this.workspaceUsers.get(workspaceId) ?? new Set<string>();
      users.add(userId);
      this.workspaceUsers.set(workspaceId, users);
    }
  }

  private removeConnection(ws: ExtendedWebSocket): void {
    const { userId, workspaceId } = ws;
    const sockets = this.userConnections.get(userId);
    if (!sockets) return;

    sockets.delete(ws);
    if (sockets.size === 0) {
      this.userConnections.delete(userId);
      if (workspaceId) {
        const users = this.workspaceUsers.get(workspaceId);
        if (users) {
          users.delete(userId);
          if (users.size === 0) this.workspaceUsers.delete(workspaceId);
        }
      }
    }
  }

  broadcast(userId: string, event: WsEvent): void {
    const sockets = this.userConnections.get(userId);
    if (!sockets) return;
    const message = JSON.stringify(event);
    for (const socket of sockets) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(message);
      }
    }
  }

  broadcastToWorkspace(workspaceId: string, event: WsEvent): void {
    const userIds = this.workspaceUsers.get(workspaceId);
    if (!userIds) return;
    for (const userId of userIds) {
      this.broadcast(userId, event);
    }
  }

  private runHeartbeat(): void {
    for (const [userId, sockets] of this.userConnections) {
      for (const ws of sockets) {
        if (!ws.isAlive) {
          ws.terminate();
          sockets.delete(ws);
          continue;
        }
        ws.isAlive = false;
        ws.ping();
      }
      if (sockets.size === 0) this.userConnections.delete(userId);
    }
  }

  close(): Promise<void> {
    clearInterval(this.heartbeatTimer);
    for (const sockets of this.userConnections.values()) {
      for (const ws of sockets) ws.terminate();
    }
    this.userConnections.clear();
    this.workspaceUsers.clear();
    return new Promise((resolve) => this.wss.close(() => resolve()));
  }

  /** @internal used in tests to inspect connection state */
  _getConnectionCount(userId: string): number {
    return this.userConnections.get(userId)?.size ?? 0;
  }

  /** @internal used in tests to trigger heartbeat synchronously */
  _runHeartbeat(): void {
    this.runHeartbeat();
  }
}
