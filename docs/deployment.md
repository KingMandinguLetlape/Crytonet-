# Deployment Guide

This guide covers deploying CRYTONET with Docker Compose (development/staging) and checklist for production.

---

## Prerequisites

- Docker Engine ≥ 24
- Docker Compose ≥ 2.20
- Node.js ≥ 20 (for local dev only)
- PostgreSQL 16
- Redis 7

---

## Docker Compose Deployment

### 1. Clone and configure

```bash
git clone https://github.com/your-org/crytonet.git
cd crytonet
cp .env.example .env
```

Edit `.env` with production-grade secrets:

```dotenv
DATABASE_URL=******postgres:5432/crytonet
REDIS_URL=redis://redis:6379
JWT_SECRET=<generate with: openssl rand -hex 32>
API_KEY_SALT=<generate with: openssl rand -hex 32>
HMAC_SECRET=<generate with: openssl rand -hex 32>
POSTGRES_PASSWORD=STRONGPASSWORD
PORT=3001
WORKER_PORT=3002
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### 2. Build and start

```bash
cd infra
docker compose up -d --build
```

### 3. Run database migrations

```bash
docker compose exec api npx prisma migrate deploy
```

### 4. Seed demo data (optional)

```bash
docker compose exec api node -e "require('./dist/prisma/seed.js')"
```

### 5. Verify

```bash
curl http://localhost:3001/health
curl http://localhost:3002/health
```

---

## Environment Variables Reference

| Variable | Required | Example |
|----------|----------|---------|
| `DATABASE_URL` | ✅ | `******host:5432/db` |
| `REDIS_URL` | ✅ | `redis://localhost:6379` |
| `JWT_SECRET` | ✅ | 32+ random hex chars |
| `API_KEY_SALT` | ✅ | 32+ random hex chars |
| `HMAC_SECRET` | ✅ | 32+ random hex chars |
| `PORT` | ❌ | `3001` |
| `WORKER_PORT` | ❌ | `3002` |
| `NODE_ENV` | ❌ | `production` |
| `NEXT_PUBLIC_API_URL` | ✅ | `https://api.yourdomain.com` |
| `POSTGRES_PASSWORD` | ✅ (compose) | Strong password |

---

## Database Migrations

CRYTONET uses Prisma Migrate.

```bash
# Apply all pending migrations (production)
npx prisma migrate deploy

# Create a new migration (development)
npx prisma migrate dev --name describe_change

# View migration status
npx prisma migrate status

# Reset database (DESTROYS ALL DATA)
npx prisma migrate reset
```

---

## Scaling

### Horizontal scaling (API)

The API is stateless. You can run multiple replicas behind a load balancer:

```yaml
# docker-compose.override.yml
services:
  api:
    deploy:
      replicas: 3
```

### Worker concurrency

Adjust BullMQ concurrency in `apps/worker/src/worker.ts`:

```typescript
const worker = new Worker('security-events', processEvent, {
  concurrency: 20,  // increase for higher throughput
});
```

---

## Production Checklist

### Security
- [ ] All secrets are 32+ characters of random data (`openssl rand -hex 32`)
- [ ] `NODE_ENV=production` is set
- [ ] TLS/HTTPS is configured on the load balancer or ingress
- [ ] Firewall rules: only ports 3000, 3001, 3002 exposed; 5432 and 6379 are internal only
- [ ] Database password is strong and not the default
- [ ] `JWT_SECRET`, `API_KEY_SALT`, `HMAC_SECRET` are different values
- [ ] Docker images are built from a pinned commit/tag

### Database
- [ ] Migrations applied: `prisma migrate deploy`
- [ ] Backups configured (daily at minimum)
- [ ] Connection pool size tuned (`DATABASE_URL?connection_limit=10`)
- [ ] Postgres `max_connections` is appropriate for the number of API replicas

### Redis
- [ ] `maxmemory` and `maxmemory-policy` configured
- [ ] Redis persistence enabled (`appendonly yes`)
- [ ] Redis password set if exposed beyond localhost

### Monitoring
- [ ] Health checks configured for all services
- [ ] Alerts set up for failed jobs in BullMQ DLQ (`security-events:dlq`)
- [ ] Log aggregation (e.g. CloudWatch, Datadog, Loki)
- [ ] Uptime monitoring on `/health` endpoints

### Application
- [ ] Seed data NOT run in production (or removed after first run)
- [ ] `NEXT_PUBLIC_API_URL` points to the production API domain
- [ ] CORS `origin` is restricted to the web dashboard domain
- [ ] Rate limiting middleware added for public routes

---

## Updating

```bash
git pull origin main
docker compose -f infra/docker-compose.yml up -d --build
docker compose exec api npx prisma migrate deploy
```

---

## Rollback

```bash
# Roll back to a specific image tag
docker compose -f infra/docker-compose.yml up -d --no-build \
  -e API_IMAGE=crytonet-api:v1.2.0

# Roll back Prisma migration
npx prisma migrate resolve --rolled-back 20240101000000_init
```
