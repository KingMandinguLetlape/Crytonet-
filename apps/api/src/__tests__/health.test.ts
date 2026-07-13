import request from 'supertest';
import app from '../app';

// Mock the DB so we don't need a real Postgres connection in tests
jest.mock('../services/db', () => ({
  db: {
    apiKey: { findFirst: jest.fn(), update: jest.fn() },
    securityEvent: { create: jest.fn(), findMany: jest.fn(), count: jest.fn() },
    decision: { findMany: jest.fn(), count: jest.fn() },
    incident: { findMany: jest.fn(), count: jest.fn() },
  },
}));

jest.mock('../services/queue', () => ({
  getQueue: jest.fn(() => ({ add: jest.fn().mockResolvedValue({}) })),
}));

describe('GET /health', () => {
  it('returns 200 with healthy status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('healthy');
    expect(res.body.data.service).toBe('crytonet-api');
  });

  it('includes a timestamp', async () => {
    const res = await request(app).get('/health');
    expect(res.body.data.timestamp).toBeTruthy();
    expect(new Date(res.body.data.timestamp).getFullYear()).toBeGreaterThan(2020);
  });

  it('includes uptime in seconds', async () => {
    const res = await request(app).get('/health');
    expect(typeof res.body.data.uptime).toBe('number');
    expect(res.body.data.uptime).toBeGreaterThanOrEqual(0);
  });
});

describe('404 handling', () => {
  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/v1/unknown-route');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
