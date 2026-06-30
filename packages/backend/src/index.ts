import { createServer } from 'node:http';
import 'dotenv/config';
import { createApp } from './app';
import { WebSocketService } from './websocket/ws.service';

const PORT = Number(process.env.PORT) || 3001;

const app = createApp();
const server = createServer(app);
const wsService = new WebSocketService(server);

server.listen(PORT, () => {
  console.info(`Backend listening on http://localhost:${PORT}`);
  console.info(`WebSocket server ready on ws://localhost:${PORT}`);
});

process.on('SIGTERM', () => {
  console.info('SIGTERM received — shutting down gracefully');
  wsService.close().then(() => {
    server.close(() => {
      console.info('Server closed');
      process.exit(0);
    });
  });
});
