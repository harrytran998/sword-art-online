# Sword Art Online

Browser-based MMORPG inspired by Sword Art Online, built with Effect-TS, Bun, React, and PixiJS.

## Prerequisites

- [proto](https://moonrepo.dev/docs/proto) (installs Bun, Node, and moon automatically via `.prototools`)
- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- [go-migrate](https://github.com/golang-migrate/migrate) (for database migrations)

```bash
# Install proto (handles all other toolchain versions)
curl -fsSL https://moonrepo.dev/install/proto.sh | bash
```

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/harrytran998/sword-art-online.git
cd sword-art-online
bun install
```

### 2. Start infrastructure

```bash
docker compose up -d
```

This starts:

| Service | Port | Description |
|---------|------|-------------|
| PostgreSQL 18 | 5432 | Primary database (`sao`) |
| Redis 7 | 6379 | Cache, sessions, rate limiting |
| TimescaleDB | 5433 | Analytics database (`sao_analytics`) |

### 3. Run migrations (optional, init scripts handle this)

The `docker/postgres/init/01-schema.sql` runs automatically on first `docker compose up`. To run migrations manually:

```bash
migrate -path ./migrations -database "postgresql://postgres:postgres@localhost:5432/sao?sslmode=disable&search_path=sao" up
```

### 4. Seed development data (optional)

```bash
bun run scripts/seed.ts
```

Seeds 3 test accounts (Kirito, Asuna, Klein) with characters and stats.

### 5. Start development

```bash
# Start all packages (server + client + shared watch)
moon run :dev

# Or start individually
moon run server:dev   # Bun server with hot reload on http://localhost:8080
moon run client:dev   # Vite dev server with HMR on http://localhost:5173
```

## Commands

| Command | Description |
|---------|-------------|
| `moon run :dev` | Start all packages in development mode |
| `moon run :build` | Build all packages |
| `moon run :test` | Run all tests |
| `moon run :lint` | Lint all packages (oxlint with type-aware rules) |
| `moon run :format` | Format all packages (oxfmt) |
| `moon run :typecheck` | TypeScript type checking |
| `moon run server:dev` | Start server only (hot reload) |
| `moon run client:dev` | Start client only (Vite HMR) |

## Project Structure

```
packages/
  server/     Bun + Effect-TS game server (port 8080)
  client/     React + PixiJS + Zustand game client
  shared/     Shared types, schemas, and constants

docs/         Architecture docs and execution plan
migrations/   go-migrate SQL migrations
scripts/      Development utilities (seed, etc.)
docker/       Docker init scripts
```

### Server Architecture

The server uses modular Clean Architecture with 10 bounded-context modules:

```
packages/server/src/
  modules/
    identity/    Auth, accounts, sessions (Better Auth)
    player/      Character, stats, progression
    combat/      Sword Skills, damage calculation
    monster/     Spawning, AI, loot tables
    inventory/   Items, equipment, enhancement
    economy/     Col, trading, auction house
    social/      Party, guild, friends, chat
    world/       Floors, zones, navigation
    quest/       Quest system, NPC interactions
    analytics/   Event logging, metrics
  shared/
    kernel/      Branded types, base events, base errors
    infrastructure/
      database/  Kysely + PostgreSQL Effect Layer
      cache/     Redis Effect Layer
      event-bus/ In-memory EventBus
      config/    App configuration
  gateway/
    websocket/   Bun WebSocket server
    game-loop/   60Hz tick-based simulation
    http/        REST endpoints (/health, /api/auth)
```

Modules communicate exclusively through the EventBus -- no direct imports between modules.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Bun |
| Backend | Effect-TS |
| Database | PostgreSQL 18 + Kysely |
| Cache | Redis 7 + ioredis |
| Auth | Better Auth |
| Frontend | React + PixiJS 8 + Zustand |
| Monorepo | moonrepo (moon) |
| Linting | oxlint (type-aware) |
| Formatting | oxfmt |
| CI/CD | GitHub Actions + GHCR |

## Docker

Build the production image:

```bash
docker build -t sao-server .
```

The Docker workflow automatically builds and pushes to GHCR on merge to `main`.

## Contributing

1. Create a feature branch from `main`: `git checkout -b feat/your-feature`
2. Make changes and ensure checks pass: `moon run :lint && moon run :typecheck && moon run :test`
3. Commit using [conventional commits](https://www.conventionalcommits.org/): `feat(module): description`
4. Push and open a PR against `main`

Branch protection requires the CI check to pass before merging.
