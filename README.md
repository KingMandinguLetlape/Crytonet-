# CRYTONET – Cybersecurity SaaS Platform

> Real-time threat detection and automated response, powered by the **ORACODE** rule engine.

[![CI](https://github.com/your-org/crytonet/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/crytonet/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CRYTONET Platform                           │
├─────────────┬───────────────────────────────┬───────────────────────┤
│  apps/web   │         apps/api              │     apps/worker       │
│  Next.js 14 │   Express + TypeScript        │  BullMQ + TypeScript  │
│  Dashboard  │   REST API  │  ORACODE Engine │  Event Processor      │
│  Port 3000  │             │  RULE_001–007   │  Port 3002 (health)   │
└─────────────┴──────┬──────┴─────────────────┴──────────────────────┘
                     │                               │
             ┌───────▼───────┐             ┌─────────▼──────────┐
             │  PostgreSQL   │             │       Redis         │
             │  (Prisma ORM) │             │   (BullMQ queues)  │
             └───────────────┘             └────────────────────┘
```

## Features

- 🛡️ **ORACODE Rule Engine** – 7 built-in detection rules (brute force, impossible travel, privilege escalation, data exfiltration, anomalous API usage, credential stuffing, session hijacking)
- 🏢 **Multi-tenancy** – complete data isolation per tenant with API key and HMAC authentication
- 👥 **RBAC** – four roles: `super_admin`, `admin`, `analyst`, `viewer`
- ⚡ **Async processing** – BullMQ with exponential backoff and dead-letter queues
- 📊 **Dashboard** – Next.js 14 with Tailwind CSS: overview, events, decisions, rules, incidents
- 🔒 **Type-safe** – strict TypeScript throughout, Zod validation, Prisma ORM
- 🐳 **Production-ready** – multi-stage Dockerfiles, docker-compose, GitHub Actions CI

---

## Quickstart

### Prerequisites

- Node.js ≥ 20
- Docker + Docker Compose
- PostgreSQL 16 (or use Docker)
- Redis 7 (or use Docker)

### 1. Clone and install

```bash
git clone https://github.com/your-org/crytonet.git
cd crytonet
cp .env.example .env          # Fill in secrets
npm install
```

### 2. Start with Docker Compose (recommended)

```bash
cd infra
docker compose up -d
```

Services:

| Service        | URL                          |
|----------------|------------------------------|
| Web Dashboard  | http://localhost:3000        |
| REST API       | http://localhost:3001        |
| Worker health  | http://localhost:3002/health |
| API health     | http://localhost:3001/health |

### 3. Run migrations and seed

```bash
npm run db:migrate
npm run db:seed
```

Demo credentials after seed:
- Demo API key: `ck_demo_0000000000000000000000000000000000000000000000000000000000000001`
- Enterprise API key: `ck_ent_00000000000000000000000000000000000000000000000000000000000000002`

### 4. Local development (without Docker)

```bash
# Terminal 1 – API
npm run dev:api

# Terminal 2 – Worker
npm run dev:worker

# Terminal 3 – Web
npm run dev:web
```

---

## API Reference Summary

All API routes require the `X-Api-Key` header.

| Method | Route | Description |
|--------|-------|-------------|
| `GET`  | `/health` | Health check |
| `POST` | `/api/v1/events` | Ingest a security event |
| `GET`  | `/api/v1/events` | List security events |
| `GET`  | `/api/v1/decisions` | List rule decisions |
| `GET`  | `/api/v1/rules` | List ORACODE rules |
| `GET`  | `/api/v1/incidents` | List incidents |

Full API reference: [docs/api.md](docs/api.md)

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | — |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | JWT signing secret (32+ chars) | — |
| `API_KEY_SALT` | HMAC salt for API key hashing | — |
| `HMAC_SECRET` | HMAC-SHA256 secret for request signing | — |
| `PORT` | API server port | `3001` |
| `WORKER_PORT` | Worker health port | `3002` |
| `NEXT_PUBLIC_API_URL` | API URL for the web dashboard | `http://localhost:3001` |

---

## Project Structure

```
crytonet/
├── apps/
│   ├── api/          # Express REST API + ORACODE engine
│   ├── web/          # Next.js 14 dashboard
│   └── worker/       # BullMQ event processor
├── packages/
│   └── shared/       # Shared TypeScript types and utilities
├── infra/
│   └── docker-compose.yml
├── docs/
│   ├── api.md
│   ├── rule-engine.md
│   ├── tenancy.md
│   └── deployment.md
├── .github/workflows/ci.yml
├── .env.example
├── package.json       # npm workspaces root
└── tsconfig.base.json
```

---

## Testing

```bash
npm test                      # Run all tests
npm test --workspace=apps/api # API tests only
```

Test coverage:
- ORACODE rule engine (RULE_001–007)
- Auth middleware (API key hashing, HMAC verification)
- Health endpoint

---

## Documentation

- [API Reference](docs/api.md)
- [ORACODE Rule Engine](docs/rule-engine.md)
- [Multi-tenancy & RBAC](docs/tenancy.md)
- [Deployment Guide](docs/deployment.md)

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Commit changes (`git commit -m 'feat: add my feature'`)
4. Push and open a Pull Request

---

## License

MIT © CRYTONET
