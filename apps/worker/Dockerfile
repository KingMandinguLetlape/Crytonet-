# ─── Stage 1: deps ──────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/worker/package.json ./apps/worker/

RUN npm install --workspace=packages/shared --workspace=apps/worker

# ─── Stage 2: builder ────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/apps/worker/node_modules ./apps/worker/node_modules

COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/api/src/rules ./apps/api/src/rules
COPY apps/worker ./apps/worker

RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=apps/worker

# ─── Stage 3: runner ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 crytonet

COPY --from=builder --chown=crytonet:nodejs /app/apps/worker/dist ./dist
COPY --from=builder --chown=crytonet:nodejs /app/apps/worker/node_modules ./node_modules
COPY --from=builder --chown=crytonet:nodejs /app/apps/worker/package.json ./

USER crytonet
EXPOSE 3002
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3002/health || exit 1

CMD ["node", "dist/index.js"]
