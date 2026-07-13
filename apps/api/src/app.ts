import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { healthRouter } from './routes/health';
import { eventsRouter } from './routes/events';
import { decisionsRouter } from './routes/decisions';
import { rulesRouter } from './routes/rules';
import { incidentsRouter } from './routes/incidents';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

const app = express();

// ─── Global middleware ─────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
      : process.env.NODE_ENV === 'production'
      ? false
      : 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Api-Key', 'X-Signature'],
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── Routes ────────────────────────────────────────────────────────────────
app.use('/health', healthRouter);
app.use('/api/v1/events', eventsRouter);
app.use('/api/v1/decisions', decisionsRouter);
app.use('/api/v1/rules', rulesRouter);
app.use('/api/v1/incidents', incidentsRouter);

// ─── Error handling ────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
