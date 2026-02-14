# ============================================================
# Sword Art Online — Server Dockerfile
# Multi-stage build for production
# ============================================================

# Stage 1: Install dependencies
FROM oven/bun:1.2-alpine AS deps
WORKDIR /app
COPY package.json bun.lockb ./
COPY packages/server/package.json ./packages/server/
COPY packages/shared/package.json ./packages/shared/
RUN bun install --frozen-lockfile --production

# Stage 2: Build
FROM oven/bun:1.2-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/server/node_modules ./packages/server/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY . .
RUN bun build packages/server/src/index.ts --outdir dist --target bun

# Stage 3: Production
FROM oven/bun:1.2-alpine AS runtime
WORKDIR /app

RUN addgroup -g 1001 -S sao && \
    adduser -S sao -u 1001

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/migrations ./migrations
COPY --from=deps /app/node_modules ./node_modules

USER sao

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:8080/healthz || exit 1

CMD ["bun", "run", "dist/index.js"]
