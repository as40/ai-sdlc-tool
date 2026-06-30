import { createApp } from './app';

const PORT = Number(process.env.PORT) || 3001;

const app = createApp();

app.listen(PORT, () => {
  console.info(`Backend listening on http://localhost:${PORT}`);
});
