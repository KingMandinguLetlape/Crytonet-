import 'dotenv/config';
import app from './app';

const PORT = parseInt(process.env.PORT ?? '3001', 10);

const server = app.listen(PORT, () => {
  console.log(`[api] CRYTONET API listening on port ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('[api] SIGTERM received – shutting down gracefully');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('[api] SIGINT received – shutting down gracefully');
  server.close(() => process.exit(0));
});
