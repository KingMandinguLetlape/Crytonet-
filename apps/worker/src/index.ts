import 'dotenv/config';
import express from 'express';
import { startWorker } from './worker';

const WORKER_PORT = parseInt(process.env.WORKER_PORT ?? '3002', 10);

// ─── Health check server ───────────────────────────────────────────────────
const app = express();
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      service: 'crytonet-worker',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
    },
  });
});

app.listen(WORKER_PORT, () => {
  console.log(`[worker] Health server on port ${WORKER_PORT}`);
});

// ─── Start BullMQ worker ───────────────────────────────────────────────────
startWorker().catch((err) => {
  console.error('[worker] Fatal error:', err);
  process.exit(1);
});
