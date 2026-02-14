# Sword Art Online - Execution Plan

**Created:** February 2026
**Based on:** All documentation in `/docs/`
**Total Duration:** 15 months (5 phases, 26 sprints)
**Target Launch:** Q1 2027

---

## How to Use This Plan

- Each phase has **parallel workstreams** marked with `[PARALLEL]` - these can be worked on simultaneously by different team members or agents
- Dependencies are noted with `[DEPENDS: ...]` - these must wait for the referenced item
- Each checklist item represents a concrete, deliverable unit of work
- Phases are sequential; sprints within a phase may overlap

---

## Phase 0: Foundation (Months 1-2, Sprints 1-4)

> **Goal:** Establish development infrastructure, core backend services, game loop, and basic client rendering.
> **Exit Criteria:** A player can log in, see a rendered Floor 1, and walk around with server-authoritative movement.

### Sprint 1 (Weeks 1-2): Project Setup

#### 1.1 Monorepo & Tooling `[PARALLEL]`

- [x] Install moonrepo: `curl -fsSL https://moonrepo.dev/install/moon.sh | bash`
- [x] Install proto (toolchain manager): `curl -fsSL https://moonrepo.dev/install/proto.sh | bash`
- [x] Initialize monorepo with moon: `moon init`
- [x] Configure `.moon/workspace.yml`:
  ```yaml
  projects:
    server: "packages/server"
    client: "packages/client"
    shared: "packages/shared"
  vcs:
    manager: "git"
    defaultBranch: "main"
  ```
- [x] Configure `.moon/toolchain.yml`:
  ```yaml
  bun:
    version: "1.2"
  node:
    version: "22"
    packageManager: "bun"
  ```
- [x] Create project-level `moon.yml` for each package (`packages/server/moon.yml`, `packages/client/moon.yml`, `packages/shared/moon.yml`) with tasks: `dev`, `build`, `test`, `lint`, `format`, `typecheck`
- [x] Configure shared tasks in `.moon/tasks.yml`:
  ```yaml
  tasks:
    lint:
      command: "oxlint --type-aware"
      inputs: ["src/**/*.ts", "src/**/*.tsx"]
    format:
      command: "oxfmt ."
      inputs: ["src/**/*.ts", "src/**/*.tsx"]
    typecheck:
      command: "tsc --noEmit"
      inputs: ["src/**/*.ts", "src/**/*.tsx", "tsconfig.json"]
  ```
- [x] Configure TypeScript (`tsconfig.json` with strict mode, path aliases)
- [x] Set up oxlint + oxfmt (oxc toolchain) — migrated to `oxlint.config.ts` with type-aware rules
- [x] Create `.env.example` with all required environment variables
- [x] Set up `CLAUDE.md` with project conventions and architecture decisions

#### 1.2 CI/CD Pipeline `[PARALLEL]`

- [x] Create GitHub Actions workflow using `moon ci` for lint + typecheck + test on PR (only affected projects)
- [x] Create GitHub Actions workflow: build Docker image on merge to `main`
- [ ] Configure branch protection rules (`main` requires PR + checks)
- [ ] Set up GHCR (GitHub Container Registry) for Docker images
- [x] Create staging deployment workflow (manual trigger)

#### 1.3 Development Environment `[PARALLEL]`

- [x] Create `docker-compose.yaml` with PostgreSQL 18, Redis 7, TimescaleDB
- [x] Write `docker/postgres/init/01-schema.sql` for initial tables
- [ ] Create seed scripts for development data
- [ ] Document local setup in `README.md` (clone, install, run)
- [ ] Verify `moon run server:dev` starts server with hot reload
- [ ] Verify `moon run client:dev` starts client with Vite HMR
- [ ] Verify `moon run :dev` starts all projects in development mode

#### 1.4 Backend Project Structure `[DEPENDS: 1.1]`

- [x] Create `packages/server/src/` with modular clean architecture folder structure:
  ```
  src/
  ├── modules/                          # Feature modules (bounded contexts)
  │   ├── identity/                     # Auth, accounts, sessions
  │   │   ├── domain/                   # Entities, value objects, domain errors
  │   │   │   ├── entities/
  │   │   │   ├── value-objects/
  │   │   │   ├── errors.ts
  │   │   │   └── index.ts
  │   │   ├── ports/                    # Interfaces (inbound + outbound)
  │   │   │   ├── inbound/
  │   │   │   ├── outbound/
  │   │   │   └── index.ts
  │   │   ├── application/              # Use cases (orchestration logic)
  │   │   ├── adapters/                 # Implementations of ports
  │   │   │   ├── inbound/
  │   │   │   ├── outbound/
  │   │   │   └── index.ts
  │   │   ├── events/                   # Domain events (published + subscriptions)
  │   │   │   ├── published.ts
  │   │   │   ├── subscriptions.ts
  │   │   │   └── index.ts
  │   │   ├── module.ts                 # Effect Layer composition
  │   │   └── index.ts                  # Public API (ports + events only)
  │   │
  │   ├── player/                       # Character, stats, progression
  │   ├── combat/                       # Sword Skills, damage calc, hit detection
  │   ├── monster/                      # Spawning, AI, loot tables
  │   ├── inventory/                    # Items, equipment, enhancement
  │   ├── economy/                      # Col, trading, auction house
  │   ├── social/                       # Party, guild, friends, chat
  │   ├── world/                        # Floors, zones, navigation, teleportation
  │   ├── quest/                        # Quest system, NPC interactions
  │   └── analytics/                    # Event logging, metrics, leaderboards
  │
  ├── shared/                           # Cross-cutting concerns
  │   ├── kernel/                       # TYPES ONLY - no logic
  │   │   ├── types.ts                 # PlayerId, ZoneId, FloorId (branded types)
  │   │   ├── events.ts               # Base DomainEvent interface
  │   │   └── errors.ts               # Base domain error types
  │   ├── infrastructure/              # Shared technical services
  │   │   ├── database/               # DatabaseService Effect Layer
  │   │   ├── cache/                  # CacheService Effect Layer
  │   │   ├── event-bus/              # EventBus Effect Layer
  │   │   └── config/                 # AppConfig Effect Layer
  │   └── index.ts
  │
  ├── gateway/                          # Entry point - routes messages to modules
  │   ├── websocket/                   # Bun WebSocket server + upgrade handler
  │   │   ├── server.ts
  │   │   ├── message-router.ts       # Routes client messages → correct module
  │   │   └── binary-protocol.ts      # Position update binary encoding
  │   ├── game-loop/                   # 60Hz tick-based simulation
  │   │   ├── game-loop.ts
  │   │   └── tick-pipeline.ts        # Per-tick processing pipeline
  │   └── http/                        # REST endpoints (health, auth via Better Auth)
  │       └── routes.ts
  │
  └── index.ts                          # Main entry - compose all module Layers
  ```
- [x] Set up Effect-TS project with `@effect/platform-bun`
- [x] Create basic HTTP server in `gateway/http/routes.ts` with `/health` and `/healthz` endpoints
- [x] Verify Bun server starts and responds on port 8080

---

### Sprint 2 (Weeks 3-4): Core Services

#### 2.1 Shared Kernel `[PARALLEL]`

- [x] Create `shared/kernel/types.ts` with branded types: `PlayerId`, `ZoneId`, `FloorId`, `ItemId`, `GuildId`, `PartyId`
- [x] Create `shared/kernel/events.ts` with base `DomainEvent` interface (`_tag`, `timestamp`, `aggregateId`)
- [x] Create `shared/kernel/errors.ts` with base `DomainError` tagged error class

#### 2.2 Database Layer `[PARALLEL]`

- [x] Install Kysely and pg driver: `bun add kysely pg`
- [x] Install go-migrate for migration management: `brew install golang-migrate` (or Docker image)
- [x] Configure Kysely with PostgreSQL 18 dialect and connection pool
- [x] Define Kysely database interface types for compile-time type safety:
  ```ts
  // shared/infrastructure/database/types.ts
  import { Generated, ColumnType } from "kysely"

  interface AccountTable {
    id: Generated<string>  // UUIDv7 via PostgreSQL 18 DEFAULT uuidv7()
    email: string
    username: string
    password_hash: string
    status: "active" | "banned" | "suspended"
    created_at: Generated<Date>
    updated_at: Generated<Date>
  }

  interface Database {
    accounts: AccountTable
    account_sessions: AccountSessionTable
    characters: CharacterTable
    character_stats: CharacterStatsTable
    // ... all other tables
  }
  ```
- [x] Create `shared/infrastructure/database/` Effect Layer wrapping Kysely instance (provides typed query builder + transaction support)
- [x] Create first go-migrate migration files:
  - `migrations/000001_create_accounts.up.sql` (accounts table with `id UUID DEFAULT uuidv7()`)
  - `migrations/000001_create_accounts.down.sql`
  - `migrations/000002_create_characters.up.sql` (characters + character_stats tables)
  - `migrations/000002_create_characters.down.sql`
- [ ] Run first migration: `migrate -path ./migrations -database "postgresql://..." up`
- [ ] Write integration test: insert/query an account using Kysely

#### 2.3 Redis Cache Layer `[PARALLEL]`

- [x] Create `shared/infrastructure/cache/` Effect Layer (get, set, invalidate, increment)
- [x] Implement connection to Redis with reconnection logic
- [x] Create helper: session storage (set with TTL, get, delete)
- [x] Create helper: rate limit counter (token bucket pattern)
- [ ] Write integration test: set/get/expire a cache key

#### 2.4 EventBus Infrastructure `[PARALLEL]`

- [x] Create `shared/infrastructure/event-bus/event-bus.ts` with `EventBus` Context.Tag (publish, subscribe)
- [x] Create `shared/infrastructure/event-bus/in-memory-event-bus.ts` with in-memory `Queue` implementation
- [x] Write test: publish event, verify subscriber receives it
- [x] Write test: multiple subscribers receive the same event

#### 2.5 Authentication Service - Identity Module (Better Auth) `[DEPENDS: 2.1, 2.2, 2.3]`

- [x] Install Better Auth: `bun add better-auth`
- [ ] Generate `BETTER_AUTH_SECRET` with `openssl rand -base64 32`, add to `.env`
- [x] Create `modules/identity/adapters/outbound/better-auth.ts` - Better Auth instance:
  ```ts
  import { betterAuth } from "better-auth"
  import { jwt, bearer } from "better-auth/plugins"
  import { kyselyAdapter } from "better-auth/adapters/kysely"
  import { db } from "@/shared/infrastructure/database"

  export const auth = betterAuth({
    database: kyselyAdapter(db, { type: "pg" }),
    emailAndPassword: { enabled: true },
    plugins: [
      jwt({
        jwt: {
          issuer: "sword-art-online",
          audience: "sword-art-game",
          expirationTime: "1h",
        },
      }),
      bearer(),
    ],
    session: {
      expiresIn: 60 * 60 * 24, // 24 hours
      updateAge: 60 * 60,      // refresh every 1 hour
    },
    secondaryStorage: {
      get: async (key) => await redis.get(key),
      set: async (key, value, ttl) => await redis.set(key, value, "EX", ttl),
      delete: async (key) => await redis.del(key),
    },
  })
  ```
- [x] Run Better Auth migrations: `bun x @better-auth/cli migrate` (migration file created: `000003_create_better_auth_tables`)
- [x] Create auth API route handler in `gateway/http/routes.ts` (`/api/auth/*`)
- [x] Create `modules/identity/ports/inbound/auth.port.ts` with `AuthPort` Context.Tag:
  - `getSession(request)` -> validate session via `auth.api.getSession`
  - `getJwtToken(sessionToken)` -> call `/api/auth/token` to get JWT for WebSocket
  - `revokeSession(token)` -> revoke session via `auth.api`
- [x] Create `modules/identity/application/login.use-case.ts` and `register.use-case.ts`
- [x] Create `modules/identity/events/published.ts`: `PlayerLoggedIn`, `PlayerRegistered` events
- [x] Create `modules/identity/module.ts` composing all identity layers
- [ ] Set up JWKS endpoint at `/api/auth/jwks` (automatic via JWT plugin)
- [x] Implement JWT validation for WebSocket upgrade in `gateway/websocket/server.ts` using `jose` library:
  ```ts
  import { jwtVerify, createRemoteJWKSet } from "jose"
  const JWKS = createRemoteJWKSet(new URL("http://localhost:8080/api/auth/jwks"))
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: "sword-art-online",
    audience: "sword-art-game",
  })
  ```
- [ ] Create client auth setup (`packages/client/src/auth.ts`):
  ```ts
  import { createAuthClient } from "better-auth/react"
  import { jwtClient, bearerClient } from "better-auth/client/plugins"
  export const authClient = createAuthClient({
    baseURL: "http://localhost:8080",
    plugins: [jwtClient(), bearerClient()],
  })
  ```
- [ ] Implement login flow: `authClient.signIn.email()` -> get JWT -> connect WebSocket with `?token={jwt}`
- [ ] Write tests: register, login, get JWT, validate JWT, revoke session

#### 2.6 Player Module `[DEPENDS: 2.2, 2.3, 2.4]`

- [x] Create `modules/player/domain/entities/character.ts` (pure TypeScript, no external deps)
- [x] Create `modules/player/domain/value-objects/` (CharacterName, Level, ExperiencePoints)
- [x] Create `modules/player/domain/errors.ts` (PlayerNotFoundError, CharacterNameTakenError)
- [x] Create `modules/player/ports/inbound/player.port.ts` with `PlayerPort` Context.Tag
- [x] Create `modules/player/ports/outbound/character.repository.ts` with `CharacterRepository` Context.Tag
- [x] Create `modules/player/application/create-character.use-case.ts`: validate name, insert character + stats, publish `PlayerCreated` event
- [x] Create `modules/player/application/get-player.use-case.ts`: cache-first lookup (Redis -> PostgreSQL)
- [x] Create `modules/player/adapters/outbound/pg-character.repository.ts`: Kysely query builder implementation
- [x] Create `modules/player/events/published.ts`: `PlayerCreated`, `PlayerLeveledUp`, `StatsAllocated`
- [x] Create `modules/player/module.ts` composing all player layers
- [x] Implement derived stats calculation (maxHp, attack, defense, etc.)
- [ ] Define class definitions: Swordsman, Fencer, Rogue, Berserker, Lancer, Archer, Monk
- [x] Write tests: create character, get player, update position

---

### Sprint 3 (Weeks 5-6): WebSocket & Game Loop

#### 3.1 WebSocket Gateway `[PARALLEL]`

- [ ] Create `gateway/websocket/server.ts` with `WebSocketGateway` Effect Layer using Bun native WebSocket
- [ ] Implement connection upgrade handler with Better Auth JWT validation (via JWKS)
- [ ] Implement origin validation (CSWSH protection) - strict allowlist
- [ ] Create `WebSocketData` interface: `{ playerId, sessionToken, connectedAt, zoneId }`
- [ ] Implement `open` handler: verify player, subscribe to zone topic, track connection
- [ ] Implement `message` handler: rate limit check, parse, validate schema, route to module
- [ ] Implement `close` handler: cleanup connection, broadcast player_left, unsubscribe topics
- [ ] Implement `broadcastToZone(zoneId, type, data)` via Bun pub/sub
- [ ] Implement `sendToPlayer(playerId, message)` via connection map
- [ ] Write test: connect, send heartbeat, receive heartbeat_ack

#### 3.2 Message Protocol & Router `[PARALLEL]`

- [ ] Define `ClientMessage` union type in `shared/kernel/messages.ts` using `_tag` discriminator (movement, skill_activate, chat, heartbeat, etc.)
- [ ] Define `ServerMessage` union type (state_update, player_joined, player_left, error, heartbeat_ack, etc.)
- [ ] Create Effect Schema validators for each client message type
- [ ] Create `gateway/websocket/message-router.ts` using `Effect.Match.tag()` to dispatch messages to correct module handlers
- [ ] Implement heartbeat protocol: client sends every 10s, server acks, disconnect after 30s timeout
- [ ] Define error codes enum: INVALID_MESSAGE, RATE_LIMITED, SKILL_ON_COOLDOWN, etc.

#### 3.3 Game Loop `[DEPENDS: 3.1]`

- [ ] Create `gateway/game-loop/game-loop.ts` with `GameLoopService` Effect Layer
- [ ] Implement 60Hz tick-based loop using `Effect.repeat` with `Schedule.spaced`
- [ ] Create `GameState` with `Ref`: tick counter, entities map, pending inputs queue
- [ ] Create `gateway/game-loop/tick-pipeline.ts` with per-tick processing:
  1. Process pending inputs (validate + route via message router)
  2. Update movement (→ world module)
  3. Process combat (→ combat module, placeholder)
  4. Update monster AI (→ monster module, placeholder)
  5. Handle collisions
  6. Validate state (anti-cheat)
  7. Broadcast delta updates to clients
  8. Increment tick
- [ ] Implement tick duration metric recording
- [ ] Write test: game loop runs at stable 60Hz for 1000 ticks

#### 3.4 World Module - Movement System `[DEPENDS: 3.3]`

- [ ] Create `modules/world/domain/entities/zone.ts` and `floor.ts`
- [ ] Create `modules/world/domain/value-objects/position.ts` and `zone-bounds.ts`
- [ ] Create `modules/world/ports/inbound/world.port.ts` with `WorldPort` Context.Tag
- [ ] Create `modules/world/application/validate-movement.use-case.ts`:
  - Client sends `movement { direction }` input (routed by gateway message router)
  - Server calculates new velocity from direction + player moveSpeed
  - Server applies physics: `newPos = pos + velocity * deltaTime`
  - Server validates: within zone bounds, no collision, speed check
  - Server broadcasts `player_moved { playerId, position, velocity }`
- [ ] Create `modules/world/events/published.ts`: `PlayerEnteredZone`, `PlayerLeftZone`, `FloorUnlocked`
- [ ] Create `modules/world/module.ts` composing all world layers
- [ ] Implement speed hack detection: compare actual distance vs max allowed per tick
- [ ] Implement teleportation detection: reject impossible position jumps
- [ ] Create position broadcasting to zone subscribers
- [ ] Write test: valid movement accepted, speed hack rejected

#### 3.5 Security Foundation `[DEPENDS: 3.1, 3.4]`

- [ ] Create security validation in `gateway/` layer (security is a cross-cutting gateway concern)
- [ ] Implement input validation pipeline in `gateway/game-loop/tick-pipeline.ts` (4 layers):
  1. Structural validation (JSON parse, required fields)
  2. Semantic validation (enum values, numeric ranges)
  3. Business logic validation (ownership, cooldowns)
  4. Anti-cheat validation (speed, position, timing)
- [ ] Create rate limiter in `shared/infrastructure/` or gateway: token bucket per player per message type
- [ ] Configure rate limits: chat 10/10s, movement 20/1s, skills 5/1s, all 100/1s
- [ ] Implement security event logging (type, severity, playerId, data, timestamp)
- [ ] Create suspicion score tracking: increment on violations, auto-ban at threshold
- [ ] Write test: rate limited after exceeding threshold

---

### Sprint 4 (Weeks 7-8): Zone System & Frontend Foundation

#### 4.1 World Module - Zone Architecture `[PARALLEL]`

- [ ] Create go-migrate migration +  Kysely type definition: `floor_definitions` table
- [ ] Create go-migrate migration +  Kysely type definition: `zone_definitions` table (id, floor_id, name, type, bounds, spawn point, pvp_enabled, safe_zone)
- [ ] Create `modules/world/ports/outbound/zone.repository.ts` with `ZoneRepository` Context.Tag
- [ ] Create `modules/world/adapters/outbound/pg-zone.repository.ts` Kysely query builder implementation
- [ ] Create `modules/world/application/change-zone.use-case.ts`:
  - Validate player can enter target zone
  - Unsubscribe from old zone topic
  - Subscribe to new zone topic
  - Publish `PlayerLeftZone` event (old zone)
  - Send `full_state` of new zone to player
  - Publish `PlayerEnteredZone` event (new zone)
- [ ] Implement zone-based pub/sub: players subscribe to `zone:{zone_id}`, `player:{player_id}`
- [ ] Implement zone player tracking (Redis SET per zone)
- [ ] Seed Floor 1 zones:
  - `floor_1_town` (Town of Beginnings, safe zone)
  - `floor_1_field_west` (Western Field)
  - `floor_1_field_east` (Eastern Field)
  - `floor_1_forest` (First Forest)
  - `floor_1_labyrinth` (Floor 1 Labyrinth Tower)

#### 4.2 Frontend Setup (Clean Architecture) `[PARALLEL]`

- [ ] Create `packages/client/` with React + TypeScript + Vite
- [ ] Create `packages/client/moon.yml` with tasks: `dev`, `build`, `test`, `lint`, `format`
- [ ] Install and configure: Tailwind CSS, Zustand, PixiJS 8
- [ ] Create Clean Architecture project structure:
  ```
  packages/client/src/
  ├── domain/                           # Pure TypeScript - ZERO dependencies
  │   ├── entities/                     # LocalPlayer, RemotePlayer, MonsterEntity, Item
  │   ├── value-objects/                # Position, Velocity, HP, MP, StatBlock
  │   └── errors.ts
  │
  ├── ports/                            # Interfaces
  │   ├── inbound/                     # Use case interfaces (game.port, combat.port, etc.)
  │   └── outbound/                    # Infrastructure interfaces (network.port, renderer.port)
  │
  ├── application/                      # Use cases + state
  │   ├── use-cases/                   # processInput, handleServerMessage, prediction
  │   └── stores/                      # Zustand stores (game, player, ui, network)
  │
  ├── adapters/                         # Concrete implementations
  │   ├── inbound/                     # keyboard.adapter, mouse.adapter
  │   ├── outbound/                    # websocket.adapter, pixi-renderer.adapter, audio.adapter
  │   └── ui/                          # React components (presentation adapters)
  │       ├── App.tsx
  │       ├── GameCanvas.tsx
  │       ├── hud/                     # HpMpBar, SkillBar, Minimap
  │       ├── panels/                  # InventoryPanel, CharacterPanel, QuestLog
  │       ├── social/                  # ChatWindow, PartyFrame, GuildPanel
  │       ├── auth/                    # LoginPage, RegisterPage, CharacterCreate
  │       └── shared/                  # Tooltip, Modal, ItemIcon
  │
  └── index.tsx                         # Wire adapters + launch
  ```

#### 4.3 Client Domain & Ports `[DEPENDS: 4.2]`

- [ ] Create `domain/entities/player.ts`: `LocalPlayer`, `RemotePlayer` interfaces (pure TypeScript)
- [ ] Create `domain/entities/monster.ts`: `MonsterEntity` (render-side representation)
- [ ] Create `domain/value-objects/position.ts`: `Position`, `Velocity`, `Direction`, `lerp()` function
- [ ] Create `domain/value-objects/stats.ts`: `HP`, `MP`, `StatBlock`
- [ ] Create `ports/outbound/network.port.ts`: `NetworkPort` interface (connect, send, onMessage, disconnect)
- [ ] Create `ports/outbound/renderer.port.ts`: `RendererPort` interface (addEntity, updateEntity, removeEntity, updateCamera)
- [ ] Create `ports/inbound/game.port.ts`: `GamePort` interface (processInput, handleServerMessage)

#### 4.4 Client Adapters - Network & Renderer `[DEPENDS: 4.3]`

- [ ] Create `adapters/outbound/websocket.adapter.ts` implementing `NetworkPort`: connect, send, reconnect, heartbeat (every 10s)
- [ ] Create `adapters/outbound/pixi-renderer.adapter.ts` implementing `RendererPort`: PixiJS Application setup, sprite management, camera
- [ ] Create basic tile-based map renderer for Floor 1 Town
- [ ] Implement player sprite rendering (placeholder art)
- [ ] Implement other-player sprite rendering from server state updates
- [ ] Create camera system: follow local player, smooth scrolling

#### 4.5 Client Application Layer `[DEPENDS: 4.3]`

- [ ] Create `application/stores/game.store.ts` (Zustand): tick, entities map, currentZone
- [ ] Create `application/stores/player.store.ts` (Zustand): localPlayer, stats, inventory, skillSlots
- [ ] Create `application/stores/ui.store.ts` (Zustand): activePanel, tooltips, modals
- [ ] Create `application/stores/network.store.ts` (Zustand): connectionStatus, latency, pendingInputs
- [ ] Create `application/use-cases/process-input.ts`: keyboard/mouse → game action → send to server
- [ ] Create `application/use-cases/handle-server-message.ts`: ServerMessage → update stores
- [ ] Create `application/use-cases/prediction.ts`: client-side prediction + server reconciliation

#### 4.6 Client Adapters - Input & UI `[DEPENDS: 4.4, 4.5]`

- [ ] Create `adapters/inbound/keyboard.adapter.ts`: WASD movement, 1-9 skill hotkeys, Escape menu
- [ ] Create `adapters/inbound/mouse.adapter.ts`: click target selection, drag-and-drop
- [ ] Create `adapters/ui/auth/LoginPage.tsx`: email + password form, use `authClient.signIn.email()`
- [ ] Create `adapters/ui/auth/RegisterPage.tsx`: email + username + password, use `authClient.signUp.email()`
- [ ] Create `adapters/ui/auth/CharacterCreate.tsx`:
  - Name input (validated against `^[A-Za-z0-9_]{2,64}$`)
  - Class selection (7 classes with descriptions)
  - Appearance options (face, hair style, hair color, eye color, skin tone)
  - Preview panel
- [ ] After login/create: fetch JWT via `authClient.token()`, then establish WebSocket with `?token={jwt}`
- [ ] Handle `connection_ready` message: load player data into stores, initialize renderer
- [ ] Render player name labels above sprites

### Phase 0 Exit Checklist

- [ ] `moon run :dev` starts server + client in development mode
- [ ] Player can register, login, create character
- [ ] WebSocket connects with JWT auth
- [ ] Player appears on Floor 1 Town of Beginnings
- [ ] WASD movement works with server-authoritative validation
- [ ] Other players visible and moving in real-time
- [ ] Speed hack attempts are detected and rejected
- [ ] 60Hz game loop runs without frame drops
- [ ] Docker Compose spins up full dev environment
- [ ] CI pipeline passes: lint + typecheck + tests

---

## Phase 1: Core Gameplay (Months 3-5, Sprints 5-8)

> **Goal:** Implement combat, monsters, inventory, progression, and Floor 1 boss.
> **Exit Criteria:** A party of players can fight through Floor 1 and defeat the boss.

### Sprint 5 (Weeks 9-10): Combat System

#### 5.1 Skill Definitions `[PARALLEL]`

- [ ] Create go-migrate migration +  Kysely type definition: `skill_definitions` table (id, name, weapon_type, level_req, hits, damage_multiplier, mp_cost, cooldown_ms, range, pre_motion_ms, execution_ms, post_motion_ms)
- [ ] Create go-migrate migration +  Kysely type definition: `character_skills` table (character_id, skill_id, level, proficiency, slot_index)
- [ ] Seed One-Handed Sword skills (10): Horizontal, Vertical, Rage Spike, Sonic Leap, Vertical Arc, Horizontal Square, Sharp Nail, Vorpal Strike, Howling Octave
- [ ] Seed Rapier skills (8): Linear, Oblique, Parallel Sting, Triangular, Star Splash, Flashing Penetrator
- [ ] Seed Dagger skills (6): Rapid Bite, Fad Edge, Criminal Brand
- [ ] Create skill slot assignment system (weapon slots 1-5, support 1-5, passive 1-3)

#### 5.2 Combat Module `[DEPENDS: 5.1]`

- [ ] Create `modules/combat/domain/entities/sword-skill.ts` and `combat-session.ts` (pure TypeScript)
- [ ] Create `modules/combat/domain/value-objects/damage-value.ts`, `critical-hit.ts`, `skill-phase.ts`
- [ ] Create `modules/combat/domain/errors.ts` (SkillOnCooldownError, OutOfRangeError, InsufficientMpError)
- [ ] Create `modules/combat/ports/inbound/combat.port.ts` with `CombatPort` Context.Tag
- [ ] Create `modules/combat/events/published.ts`: `SkillExecuted`, `DamageDealt`, `PlayerDefeated`
- [ ] Create `modules/combat/module.ts` composing all combat layers
- [ ] Implement Sword Skill activation flow in `modules/combat/application/activate-skill.use-case.ts`:
  1. **Pre-motion**: validate MP, cooldown, target; lock player state; broadcast glow effect
  2. **System recognition**: server acknowledges; set animation state
  3. **Auto-execution**: calculate damage server-side, apply to target(s), broadcast `skill_executed`
  4. **Post-motion delay**: player frozen for `post_motion_ms`; vulnerable window
  5. **Cooldown**: skill enters cooldown; other skills available
- [ ] Implement damage formula: `Base = WeaponATK * SkillMultiplier; Final = Base * (1 - EnemyDEF/(EnemyDEF+100))`
- [ ] Implement critical hit: `CritRate = DEX * 0.5 + equipment; CritDmg = 150% + LCK * 0.5%`
- [ ] Implement auto-attack (basic attack without Sword Skill)
- [ ] Create cooldown tracking in Redis: `skill_cd:{playerId}:{skillId}` with TTL

#### 5.3 Combat Validation `[DEPENDS: 5.2]`

- [ ] Implement range check: distance between attacker and target <= skill.range (10% tolerance for lag)
- [ ] Implement line-of-sight check (raycast between positions)
- [ ] Implement MP/resource validation before skill execution
- [ ] Implement cooldown validation (reject if skill still cooling)
- [ ] Implement action rate check (max 10 actions/second)
- [ ] Log combat cheat attempts to security events

#### 5.4 Combat Frontend `[DEPENDS: 5.2]`

- [ ] Create skills bar UI (slots 1-9 with keybinds)
- [ ] Implement target selection (click enemy, Tab cycle)
- [ ] Render skill animations (placeholder: colored particle effects per skill)
- [ ] Show damage numbers floating above targets
- [ ] Display skill cooldown timers on skill bar
- [ ] Show HP/MP bars above players and monsters
- [ ] Implement Sword Skill glow effect during pre-motion

---

### Sprint 6 (Weeks 11-12): Monster System

#### 6.1 Monster Definitions `[PARALLEL]`

- [ ] Create go-migrate migration +  Kysely type definition: `monster_definitions` table (id, name, type, level, hp, attack, defense, exp_reward, col_min, col_max, loot_table_id, aggro_range, respawn_time)
- [ ] Create go-migrate migration +  Kysely type definition: `monster_spawns` table (id, monster_def_id, zone_id, spawn_x/y/z, spawn_count, spawn_radius)
- [ ] Create go-migrate migration +  Kysely type definition: `loot_tables` + `loot_table_entries` (item_def_id, drop_chance, quantity_min, quantity_max)
- [ ] Seed Floor 1 monsters (10 types):
  - Frenzy Boar (Lv 1-3, field)
  - Dire Wolf (Lv 2-4, forest)
  - Ruin Kobold (Lv 3-5, labyrinth)
  - Giant Wasp (Lv 4-6, field)
  - Goblin Warrior (Lv 5-7, labyrinth)
  - Stone Golem (Lv 6-8, labyrinth)
  - Treant (Lv 7-9, forest)
  - Skeleton Archer (Lv 8-10, labyrinth)
  - Shadow Lurker (Lv 9-11, labyrinth)
  - Ruin Kobold Sentinel (Lv 10-12, labyrinth elite)

#### 6.2 Monster Module - Spawn System `[DEPENDS: 6.1]`

- [ ] Create `modules/monster/domain/entities/monster.ts`, `spawn-point.ts`, `loot-table.ts` (pure TypeScript)
- [ ] Create `modules/monster/domain/value-objects/aggro-range.ts`, `respawn-timer.ts`
- [ ] Create `modules/monster/ports/inbound/monster.port.ts` with `MonsterPort` Context.Tag
- [ ] Create `modules/monster/events/published.ts`: `MonsterSpawned`, `MonsterKilled`, `LootDropped`
- [ ] Create `modules/monster/module.ts` composing all monster layers
- [ ] Implement spawn manager in `modules/monster/application/spawn-monster.use-case.ts`: on server start, load all spawn points for active zones
- [ ] Create spawn logic: for each spawn point, if no alive instance and respawn timer elapsed, spawn monster
- [ ] Implement respawn timer: on monster death, set `next_spawn_at = now + respawn_time`
- [ ] Create dynamic spawn adjustment: reduce spawn count if zone has few players
- [ ] Integrate spawn updates into game loop tick

#### 6.3 Monster Module - AI `[DEPENDS: 6.2]`

- [ ] Create `modules/monster/application/update-monster-ai.use-case.ts`
- [ ] Implement finite state machine for monster behavior:
  - **Idle**: stand at spawn, face random direction
  - **Patrol**: walk randomly within `patrol_range` of spawn
  - **Aggro**: player enters `aggro_range`, start pursuing
  - **Attack**: within melee range, execute attack pattern
  - **Return**: if target escapes aggro range, return to spawn (reset HP)
  - **Death**: play death animation, drop loot, schedule respawn
- [ ] Create `AggroManager`: track aggro per player (damage * 1.0, heal * 0.5, proximity * 10/tick)
- [ ] Implement monster attack patterns: basic melee, charge, AoE (varies by monster type)
- [ ] Implement telegraphed attacks: broadcast warning to nearby players before big attacks
- [ ] Write test: monster aggros on player in range, attacks, drops loot on death

#### 6.4 Monster Module - Loot System `[DEPENDS: 6.3]`

- [ ] Create `modules/monster/application/drop-loot.use-case.ts`
- [ ] Implement server-authoritative loot drop:
  1. On monster death, roll loot table entries against drop_chance
  2. Determine Col reward: random between `col_min` and `col_max`
  3. Create dropped item entities at monster death position
  4. Broadcast `monster_killed { monsterId, loot, experience }` to zone
- [ ] Implement Last Attack Bonus: extra loot for player dealing killing blow
- [ ] Implement loot pickup: validate player proximity, add to inventory
- [ ] Create loot protection timer: 30s exclusive to killer, then free-for-all

---

### Sprint 7 (Weeks 13-14): Inventory & Equipment

#### 7.1 Item System `[PARALLEL]`

- [ ] Create go-migrate migration +  Kysely type definition: `item_definitions` table (id, name, description, category, subcategory, rarity, stats JSONB, requirements JSONB, max_stack, tradeable, base_price)
- [ ] Create go-migrate migration +  Kysely type definition: `character_inventory` table (id, character_id, item_def_id, quantity, enhancement_level, enhancement_stats JSONB, durability, slot_type, slot_index)
- [ ] Seed starter equipment per class (weapon + basic armor set)
- [ ] Seed consumables: HP Potion (Small/Medium/Large), MP Potion, Antidote, Teleport Crystal
- [ ] Seed Floor 1 monster drop items: materials, equipment, crystals
- [ ] Create equipment slot mapping:
  - 0: Main Hand, 1: Off Hand, 2: Head, 3: Chest, 4: Hands, 5: Legs, 6: Feet, 7-9: Accessories

#### 7.2 Inventory Module `[DEPENDS: 7.1]`

- [ ] Create `modules/inventory/domain/entities/inventory-slot.ts`, `equipment.ts`, `item-definition.ts` (pure TypeScript)
- [ ] Create `modules/inventory/domain/value-objects/equipment-slot.ts`, `enhancement-level.ts`
- [ ] Create `modules/inventory/ports/inbound/inventory.port.ts` with `InventoryPort` Context.Tag
- [ ] Create `modules/inventory/ports/outbound/inventory.repository.ts` with `InventoryRepository` Context.Tag
- [ ] Create `modules/inventory/events/published.ts`: `ItemPickedUp`, `ItemEquipped`, `ItemUsed`, `ItemEnhanced`
- [ ] Create `modules/inventory/events/subscriptions.ts`: subscribe to `MonsterKilled` → generate loot
- [ ] Create `modules/inventory/module.ts` composing all inventory layers
- [ ] Implement `addItem` in `modules/inventory/application/add-item.use-case.ts`: find stackable slot or empty slot, validate max stack, insert
- [ ] Implement `removeItem`: validate ownership + quantity, decrement or delete
- [ ] Implement `moveItem`: swap slot positions within inventory
- [ ] Implement `equipItem`: validate requirements (level, class, stats), move to equipment slot, recalculate derived stats
- [ ] Implement `unequipItem`: move from equipment slot to inventory (check space)
- [ ] Implement `useItem`: consume consumable (heal HP/MP, teleport), validate cooldown
- [ ] Implement `dropItem`: remove from inventory, create world item entity
- [ ] Implement NPC buy/sell: validate proximity to merchant NPC, calculate price

#### 7.3 Inventory Security `[DEPENDS: 7.2]`

- [ ] Implement inventory lock during operations (Redis distributed lock)
- [ ] Implement item ownership validation on every operation
- [ ] Create inventory state validation: check for negative quantities, impossible enhancements, duplicate unique slots
- [ ] Implement atomic item transfers using database transactions
- [ ] Implement duplication prevention: unique transaction IDs, idempotency checks
- [ ] Write test: concurrent inventory operations don't cause duplication

#### 7.4 Inventory Frontend `[DEPENDS: 7.2]`

- [ ] Create Inventory UI panel (grid layout, 40 slots)
- [ ] Create Equipment UI panel (paper doll with 10 slots)
- [ ] Implement drag-and-drop item movement
- [ ] Show item tooltips on hover (name, rarity, stats, requirements)
- [ ] Implement right-click context menu: Equip, Use, Drop, Info
- [ ] Display character stats panel with derived stat calculations
- [ ] Show equipment stat bonuses

---

### Sprint 8 (Weeks 15-16): Progression & Floor 1 Boss

#### 8.1 Experience & Leveling `[PARALLEL]`

- [ ] Implement experience curve formula: `XP_needed(level) = 100 * level^2`
- [ ] Create `modules/player/application/level-up.use-case.ts`:
  - Check if current XP >= XP_needed
  - Increment level, award stat points (5 per level)
  - Recalculate derived stats (maxHp, maxMp, etc.)
  - Publish `PlayerLeveledUp` event (broadcast `level_up` to zone via EventBus)
- [ ] Implement stat point allocation: validate points available, apply to chosen stat
- [ ] Implement death penalty: lose 10% of current level XP (never level down)
- [ ] Create experience distribution: solo = 100% to killer; party = shared within range

#### 8.2 Skill Proficiency `[PARALLEL]`

- [ ] Implement skill proficiency tracking: increment on each use
- [ ] Create proficiency tiers:
  - Novice (0-99): 90% skill power
  - Apprentice (100-499): 100% skill power
  - Expert (500-999): 110% skill power
  - Master (1000-4999): 125% power, -10% cooldown
  - Grandmaster (5000+): 150% power, -20% cooldown, special effects
- [ ] Implement skill unlock requirements: level thresholds per skill
- [ ] Create skill slot management: assign/unassign skills to hotbar

#### 8.3 Floor 1 Boss: Illfang the Kobold Lord `[DEPENDS: 6.3, 5.2]`

- [ ] Create boss room zone: `floor_1_boss_room` (sealed on entry)
- [ ] Define Illfang boss: Lv 15, 3 HP bars, floor_boss type
- [ ] Implement 3-phase boss AI:
  - **Phase 1** (HP bar 1): Basic melee attacks, summon 3 Ruin Kobold Sentinels
  - **Phase 2** (HP bar 2): Switch weapon (talwar), faster attacks, wider AoE
  - **Phase 3** (HP bar 3): Enrage mode, continuous charge attacks, room-wide AoE
- [ ] Implement boss room sealing: once battle starts, door locks (no entry/exit until win or wipe)
- [ ] Implement anti-crystal zone: teleport crystals disabled in boss room
- [ ] Create boss loot: Coat of Midnight (Last Attack Bonus), Guiding Plate (participation)
- [ ] Implement floor unlock: on boss defeat, Floor 2 teleport gate activates

#### 8.4 Boss Frontend `[DEPENDS: 8.3]`

- [ ] Create boss HP bar UI (multi-bar display at top of screen)
- [ ] Implement boss phase transition effects
- [ ] Show boss name and level
- [ ] Create boss aggro indicator (who the boss is targeting)
- [ ] Implement boss room transition animation

### Phase 1 Exit Checklist

- [ ] Sword Skills system works: pre-motion -> execution -> post-motion -> cooldown
- [ ] 10+ monster types spawning and fighting with AI
- [ ] Loot drops and pickup working
- [ ] Full inventory and equipment system
- [ ] Equipment affects character stats
- [ ] Level progression (1-20) with stat allocation
- [ ] Skill proficiency tracking
- [ ] Illfang boss defeatable by a coordinated party
- [ ] Floor 1 fully playable end-to-end
- [ ] Alpha test with 100 concurrent players stable

---

## Phase 2: Social & Economy (Months 6-8, Sprints 9-12)

> **Goal:** Implement party, trading, guilds, chat, and friend systems.
> **Exit Criteria:** Players can form parties, trade items, create guilds, and communicate.

### Sprint 9 (Weeks 17-18): Party System

#### 9.1 Social Module - Party System `[PARALLEL]`

- [ ] Create `modules/social/domain/entities/party.ts`, `guild.ts`, `friendship.ts`, `chat-message.ts` (pure TypeScript)
- [ ] Create `modules/social/domain/value-objects/party-id.ts`, `guild-id.ts`, `guild-rank.ts`, `chat-channel.ts`
- [ ] Create `modules/social/ports/inbound/social.port.ts` with `SocialPort` Context.Tag
- [ ] Create `modules/social/events/published.ts`: `PartyCreated`, `GuildCreated`, `ChatSent`, `FriendAdded`
- [ ] Create `modules/social/module.ts` composing all social layers
- [ ] Implement party creation in `modules/social/application/create-party.use-case.ts`: leader creates, max 6 members
- [ ] Implement invite flow: leader sends invite -> target receives `party_invite_received` -> accept/decline
- [ ] Implement party leave and kick
- [ ] Implement leader transfer
- [ ] Implement party disband (when leader leaves with < 2 members or explicit disband)
- [ ] Store party state in Redis (ephemeral, not persisted)
- [ ] Create party pub/sub topic: `party:{party_id}` for party-wide messages

#### 9.2 Party Features `[DEPENDS: 9.1]`

- [ ] Implement shared HP/MP bars: party members see each other's health
- [ ] Implement party minimap markers: show party member positions
- [ ] Implement party chat channel
- [ ] Implement loot distribution modes:
  - **Free-for-All**: first pickup gets it
  - **Round-Robin**: auto-distribute in rotation
  - **Leader Distribute**: leader assigns loot
- [ ] Implement shared experience: distribute XP to party members within range

#### 9.3 Raid System `[DEPENDS: 9.1]`

- [ ] Implement raid group: up to 8 parties (48 players)
- [ ] Create raid leader role
- [ ] Implement raid chat channel
- [ ] Create raid HP bar display (all 48 members)
- [ ] Implement raid-wide loot distribution

#### 9.4 Party Frontend `[DEPENDS: 9.2]`

- [ ] Create party frame UI: show member names, HP bars, class icons
- [ ] Create party invite dialog
- [ ] Create loot distribution settings UI
- [ ] Add party markers on minimap
- [ ] Show party chat tab in chat window

---

### Sprint 10 (Weeks 19-20): Trading & Economy

#### 10.1 Economy Module - Trade System `[PARALLEL]`

- [ ] Create `modules/economy/domain/entities/trade.ts`, `auction-listing.ts`, `npc-shop.ts` (pure TypeScript)
- [ ] Create `modules/economy/domain/value-objects/col.ts`, `trade-id.ts`, `auction-bid.ts`
- [ ] Create `modules/economy/ports/inbound/economy.port.ts` with `EconomyPort` Context.Tag
- [ ] Create `modules/economy/events/published.ts`: `TradeCompleted`, `AuctionSold`, `ColTransferred`
- [ ] Create `modules/economy/module.ts` composing all economy layers
- [ ] Implement trade request in `modules/economy/application/initiate-trade.use-case.ts`: initiator sends request -> target receives -> accept/decline
- [ ] Implement trade window:
  - Both players can add items and Col
  - Each addition broadcasts `trade_updated` to both
  - Both must confirm to execute
  - Any modification resets confirmations
- [ ] Implement atomic trade execution (database transaction):
  1. Lock both inventories
  2. Validate all items still exist and owned
  3. Validate Col amounts
  4. Remove items from both
  5. Transfer Col
  6. Add items to both
  7. Release locks
  8. Log transaction
- [ ] Implement trade cancellation: either player can cancel anytime before execution

#### 10.2 Trade Security `[DEPENDS: 10.1]`

- [ ] Implement inventory locking during active trade (prevent using traded items)
- [ ] Implement unfair trade detection: flag trades where value ratio > 10:1
- [ ] Implement trade logging to `economy_transactions` table for audit trail
- [ ] Implement anti-RMT: detect patterns of one-sided high-value trades
- [ ] Implement trade cooldown: 5 trade requests per 60 seconds

#### 10.3 Economy Module - Auction House `[DEPENDS: 10.1]`

- [ ] Create go-migrate migration +  Kysely type definition: `auction_listings` table
- [ ] Create `modules/economy/application/create-auction.use-case.ts` and `place-bid.use-case.ts`
- [ ] Implement listing creation: set starting bid, optional buyout, duration (1-168 hours)
- [ ] Implement bidding: validate bid > current, lock Col, refund previous bidder
- [ ] Implement buyout: instant purchase at buyout price
- [ ] Implement auction expiration: return item to seller if no bids
- [ ] Implement auction completion: transfer item to winner, Col to seller minus 10% tax
- [ ] Create auction house UI: browse, search, filter by category/rarity/level, sort by price

#### 10.4 NPC Shops `[PARALLEL]`

- [ ] Create go-migrate migration +  Kysely type definition: `npc_definitions` table, `npc_shops` + `npc_shop_items`
- [ ] Seed Floor 1 NPCs: weapon merchant, armor merchant, potion merchant, blacksmith
- [ ] Implement NPC buy: validate proximity, deduct Col, add item
- [ ] Implement NPC sell: validate proximity, remove item, add Col (25-50% of base_price)
- [ ] Create shop UI: NPC inventory grid, buy/sell buttons, price display

---

### Sprint 11 (Weeks 21-22): Guild System

#### 11.1 Guild Service `[PARALLEL]`

- [ ] Create go-migrate migration +  Kysely type definition: `guilds` table (id, name, tag, leader_id, level, experience, bank_col, max_members)
- [ ] Create go-migrate migration +  Kysely type definition: `guild_members` table (guild_id, character_id, rank, contribution_points)
- [ ] Create go-migrate migration +  Kysely type definition: `guild_bank` table (guild_id, item_def_id, quantity, slot_index, deposited_by)
- [ ] Create `modules/social/application/create-guild.use-case.ts` and `invite-to-guild.use-case.ts`
- [ ] Implement guild creation: validate name uniqueness, deduct 100,000 Col (via `ColTransferred` event), insert guild + leader
- [ ] Implement guild invite: officer+ sends -> target receives -> accept/decline
- [ ] Implement rank management: leader can promote/demote (leader, officer, veteran, member, recruit)
- [ ] Implement guild kick: officer+ can kick lower ranks
- [ ] Implement guild disband: leader only, return bank items/Col
- [ ] Create guild pub/sub topic: `guild:{guild_id}`

#### 11.2 Guild Features `[DEPENDS: 11.1]`

- [ ] Implement guild chat channel
- [ ] Implement guild bank: deposit/withdraw items (officer+ for withdraw)
- [ ] Implement guild announcement: leader/officer sets announcement message
- [ ] Implement guild leaderboard: sorted by guild XP
- [ ] Implement guild leveling: guild gains XP from member activities, increases member cap
- [ ] Implement guild name/tag display above member characters

#### 11.3 Guild Frontend `[DEPENDS: 11.2]`

- [ ] Create guild panel UI: member list, rank management, bank tab
- [ ] Create guild creation dialog
- [ ] Create guild invite dialog
- [ ] Show guild tag next to player names
- [ ] Add guild chat tab in chat window

---

### Sprint 12 (Weeks 23-24): Communication & Social

#### 12.1 Chat Service `[PARALLEL]`

- [ ] Create `modules/social/application/send-chat.use-case.ts`
- [ ] Implement chat channels (routed from gateway via `chat` message tag):
  - **Say**: broadcast to players within 50m radius
  - **Shout**: broadcast to entire zone
  - **Whisper**: private message to specific player (global)
  - **Party**: party members only (global)
  - **Guild**: guild members only (global)
  - **World**: server-wide (rate limited: 1 per 30s)
  - **Trade**: trade channel for buying/selling announcements
- [ ] Implement chat message validation: max 500 chars, profanity filter
- [ ] Implement chat logging to `chat_messages` table
- [ ] Implement mute system: moderators can mute players for duration

#### 12.2 Friend System `[PARALLEL]`

- [ ] Create go-migrate migration +  Kysely type definition: `friendships` table (requester_id, accepter_id, status)
- [ ] Create `modules/social/application/add-friend.use-case.ts`
- [ ] Implement friend request: send -> receive -> accept/decline/block
- [ ] Implement friend list: show online status, floor, zone
- [ ] Implement online status change notifications to friends
- [ ] Implement block/ignore list: blocked players can't whisper or invite

#### 12.3 Communication Frontend `[DEPENDS: 12.1, 12.2]`

- [ ] Create chat window with tabs: Say, Party, Guild, Whisper, World, Trade
- [ ] Implement chat input with channel selector
- [ ] Create friend list panel: online/offline sections, right-click actions (whisper, invite, remove)
- [ ] Create notification popups: friend request received, party invite, guild invite
- [ ] Implement emote system: `/emote wave`, `/emote sit`, etc.
- [ ] Create item linking in chat: `[Item Name]` clickable to show tooltip

### Phase 2 Exit Checklist

- [ ] Party system: create, invite, shared XP/loot, up to 6 players
- [ ] Raid groups: up to 48 players for boss fights
- [ ] Player-to-player trading with atomic transactions
- [ ] Auction house: list, bid, buyout
- [ ] NPC shops: buy/sell items
- [ ] Guild system: create, invite, ranks, bank, chat
- [ ] Full chat system: say, shout, whisper, party, guild, world
- [ ] Friend list with online status
- [ ] Closed beta with 1,000 concurrent players stable
- [ ] Economy anti-exploit: duplication prevention, unfair trade detection

---

## Phase 3: Content Expansion (Months 9-12, Sprints 13-20)

> **Goal:** Expand to Floors 2-25, add crafting, quests, more weapons, and enhancement system.
> **Exit Criteria:** 25 floors playable with diverse content, crafting, quests, and balanced progression.

### Sprint 13-14 (Weeks 25-28): Floors 2-10

#### 13.1 Floor Content Pipeline `[PARALLEL]`

For each floor (2-10), create:
- [ ] Floor definition: theme, recommended level range, diameter
- [ ] Zone definitions: 3-5 zones per floor (town/safe zone, fields, labyrinth)
- [ ] Monster definitions: 5-10 new monster types per floor, scaling stats
- [ ] Spawn configurations: spawn points across zones
- [ ] Loot tables: floor-appropriate gear drops
- [ ] Floor boss design: unique mechanics, 4-6 HP bars
- [ ] NPC placements: merchants, quest givers

#### 13.2 Floor 2-5 Implementation `[PARALLEL]`

- [ ] Floor 2: Grassland theme, Bull-type monsters, Asterius boss
- [ ] Floor 3: Canyon theme, Bird/Reptile monsters, Wyvern boss
- [ ] Floor 4: Lake/River theme, Aquatic monsters, Kraken boss
- [ ] Floor 5: Dark Forest theme, Undead/Spirit monsters, Wraith Lord boss
- [ ] Create unique mechanics for each boss (summoning, environmental hazards, phase transitions)

#### 13.3 Floor 6-10 Implementation `[PARALLEL]`

- [ ] Floor 6: Mountain theme
- [ ] Floor 7: Ruins theme
- [ ] Floor 8: Swamp theme
- [ ] Floor 9: Volcano theme
- [ ] Floor 10: Castle theme (mid-game milestone)
- [ ] Floor 10 boss: significantly harder, requires raid coordination

#### 13.4 Equipment Scaling `[DEPENDS: 13.2, 13.3]`

- [ ] Create tiered equipment sets per floor range:
  - Floors 1-5: Common/Uncommon gear (Lv 1-15)
  - Floors 6-10: Uncommon/Rare gear (Lv 16-30)
- [ ] Balance weapon damage progression
- [ ] Balance armor defense progression
- [ ] Create unique boss drop weapons with special effects

---

### Sprint 15-16 (Weeks 29-32): Floors 11-25 & Enhancement

#### 15.1 Floors 11-25 Content `[PARALLEL]`

- [ ] Floors 11-15: Forest & Mountain themes (Lv 30-45)
- [ ] Floors 16-20: Desert & Ruins themes (Lv 45-60)
- [ ] Floors 21-25: Arctic & Underground themes (Lv 60-75)
- [ ] 15 floor bosses with increasing complexity
- [ ] Rare/Epic gear drops for floors 11-25
- [ ] Field boss encounters on select floors (respawn every 2-6 hours)

#### 15.2 Enhancement System `[PARALLEL]`

- [ ] Create `modules/inventory/application/enhance-item.use-case.ts`
- [ ] Implement 5 enhancement parameters: Sharpness, Accuracy, Quickness, Heaviness, Durability
- [ ] Implement enhancement mechanics:
  - Visit blacksmith NPC
  - Select item + parameter + materials
  - Success rate: +1 to +4 guaranteed, +5 to +10 decreasing (90% -> 10%)
  - Failure: material loss, possible -1 level (below safe points +3, +6, +9)
  - Critical failure at max attempts: item destroyed
- [ ] Create enhancement materials (drop from bosses and rare monsters)
- [ ] Implement enhancement UI: select item, choose parameter, see success rate, confirm

#### 15.3 Weapon Expansion `[PARALLEL]`

- [ ] Add Two-Handed Sword skills: Avalanche, Cyclone, Double Circular
- [ ] Add Spear/Polearm skills: Polearm Thrust, Spiral Lance
- [ ] Add Bow skills: Single Shot, Multi Shot, Rain of Arrows
- [ ] Add Katana skills (extra skill): Tsujikaze, Gengetsu
- [ ] Balance all weapon types for viability
- [ ] Create unique/legendary weapons for select floor bosses

---

### Sprint 17-18 (Weeks 33-36): Crafting & Quest System

#### 17.1 Crafting System `[PARALLEL]`

- [ ] Create `modules/inventory/application/craft-item.use-case.ts` (crafting is part of the inventory module)
- [ ] Implement Blacksmith profession:
  - Craft weapons and armor from materials
  - Repair equipment durability
  - Recipe system: discover recipes from drops or NPCs
  - Crafting quality: skill level affects output stats
- [ ] Implement Alchemy profession:
  - Craft HP/MP potions, buff potions, antidotes
  - Material combination system
  - Higher skill = better potion effects
- [ ] Implement Cooking profession:
  - Cook food for temporary stat buffs
  - Recipe discovery through experimentation
  - Buff duration scales with cooking skill
- [ ] Create material gathering: harvest nodes in field zones, respawn timers
- [ ] Create crafting UI: recipe list, material requirements, craft button, success animation

#### 17.2 Quest System `[PARALLEL]`

- [ ] Create go-migrate migration +  Kysely type definition: `quest_definitions` table (id, name, description, type, required_level, objectives JSONB, rewards)
- [ ] Create go-migrate migration +  Kysely type definition: `character_quests` table (character_id, quest_id, status, objective_progress JSONB)
- [ ] Create `modules/quest/domain/entities/quest.ts`, `quest-objective.ts`, `npc-dialogue.ts` (pure TypeScript)
- [ ] Create `modules/quest/domain/value-objects/quest-id.ts`, `objective-progress.ts`, `quest-status.ts`
- [ ] Create `modules/quest/ports/inbound/quest.port.ts` with `QuestPort` Context.Tag
- [ ] Create `modules/quest/events/published.ts`: `QuestAccepted`, `QuestCompleted`, `ObjectiveUpdated`
- [ ] Create `modules/quest/events/subscriptions.ts`: subscribe to `MonsterKilled`, `ItemPickedUp` for quest objective tracking
- [ ] Create `modules/quest/module.ts` composing all quest layers
- [ ] Create `modules/quest/application/accept-quest.use-case.ts`, `update-progress.use-case.ts`, `complete-quest.use-case.ts`
- [ ] Implement quest types:
  - **Main quests**: story progression, floor-related (1 per floor)
  - **Side quests**: optional content, NPC-given
  - **Daily quests**: reset daily, repeatable (kill X, gather Y)
  - **Chain quests**: multi-part questlines
- [ ] Implement quest objectives: kill count, item collection, delivery, escort, boss defeat
- [ ] Implement quest tracking: progress updates on relevant actions
- [ ] Implement quest rewards: XP, Col, items
- [ ] Seed 50+ quests across Floors 1-25
- [ ] Create quest log UI: active quests, completed, objectives tracker

#### 17.3 Achievement System `[PARALLEL]`

- [ ] Create go-migrate migration +  Kysely type definition: `achievement_definitions` + `character_achievements`
- [ ] Create achievement tracking in `modules/analytics/` (achievements are analytics-adjacent, subscribe to events from all modules)
- [ ] Implement achievement categories: combat, exploration, social, economy, special
- [ ] Seed 30+ achievements (first floor clear, first boss kill, reach level milestones, etc.)
- [ ] Create achievement popup notification
- [ ] Create achievement panel UI

---

### Sprint 19-20 (Weeks 37-40): Polish & Balance

#### 19.1 Level Progression Balance `[PARALLEL]`

- [ ] Balance XP curve for levels 1-75
- [ ] Balance monster difficulty across all 25 floors
- [ ] Balance equipment stat progression
- [ ] Balance economy: Col income vs sinks (repairs, potions, enhancements, guild costs)
- [ ] Ensure monster drop rates produce healthy economy inflation < 5%/month

#### 19.2 Analytics Integration `[PARALLEL]`

- [ ] Set up TimescaleDB schema: `game_events`, `player_sessions`, `combat_logs`
- [ ] Create `modules/analytics/domain/entities/game-event.ts`, `leaderboard-entry.ts`
- [ ] Create `modules/analytics/ports/inbound/analytics.port.ts` with `AnalyticsPort` Context.Tag
- [ ] Create `modules/analytics/events/subscriptions.ts`: subscribe to events from ALL modules (PlayerLoggedIn, MonsterKilled, TradeCompleted, etc.)
- [ ] Create `modules/analytics/module.ts` composing all analytics layers
- [ ] Log key events: player login/logout, monster kills, item drops, trades, level ups, deaths
- [ ] Create continuous aggregates: DAU, session duration, floor population, economy metrics
- [ ] Build Grafana dashboard for game health monitoring

#### 19.3 Performance Optimization `[PARALLEL]`

- [ ] Profile game loop: identify bottlenecks, optimize hot paths
- [ ] Implement binary protocol for position updates (43 bytes vs ~200 bytes JSON)
- [ ] Implement client-side prediction with server reconciliation
- [ ] Optimize database queries: add missing indexes, use read replicas
- [ ] Implement connection pooling with PgBouncer
- [ ] Load test: verify 500 players per zone, 10,000 per server shard

### Phase 3 Exit Checklist

- [ ] Floors 1-25 fully playable with unique bosses
- [ ] 100+ monster types across all floors
- [ ] 3 crafting professions functional
- [ ] Enhancement system working (+1 to +10)
- [ ] 50+ quests completable
- [ ] 30+ achievements
- [ ] 5+ weapon types with unique skill trees
- [ ] Level 1-75 progression balanced
- [ ] Economy stable with proper sinks/sources
- [ ] Open beta with 10,000 concurrent players
- [ ] Analytics dashboard live

---

## Phase 4: Polish & Launch (Months 13-15, Sprints 21-26)

> **Goal:** Optimize performance, polish UI/UX, balance gameplay, and launch.
> **Exit Criteria:** Global launch with 50,000+ players, 99.9% uptime.

### Sprint 21-22 (Weeks 41-44): Performance & UI Polish

#### 21.1 Performance `[PARALLEL]`

- [ ] Achieve < 16.67ms (60 FPS) tick duration at 95th percentile
- [ ] Achieve < 100ms network latency for 95% of players
- [ ] Achieve < 10ms database query latency at 95th percentile
- [ ] Implement zone instancing for overcrowded zones (> 500 players)
- [ ] Optimize Redis usage: batch operations, pipeline commands
- [ ] Enable Bun's `reusePort` for multi-core utilization

#### 21.2 UI/UX Polish `[PARALLEL]`

- [ ] Redesign main menu / login screen with SAO theme
- [ ] Polish character creation with live preview
- [ ] Improve HUD layout: HP/MP bars, skill bar, minimap, compass
- [ ] Create settings menu: graphics quality, sound volume, keybindings, accessibility
- [ ] Implement tutorial system: guided first-time player experience (Floor 1 intro quest)
- [ ] Add loading screens with tips and lore
- [ ] Implement death/respawn screen

#### 21.3 Sound & Effects `[PARALLEL]`

- [ ] Add sound effects: sword skills, monster attacks, UI clicks, level up, loot drop
- [ ] Implement background music: different tracks per floor theme
- [ ] Add combat particle effects: sword trails, impact sparks, heal glow
- [ ] Create Sword Skill glow effects per weapon type (different colors)
- [ ] Add ambient effects: rain, wind, torch flicker

#### 21.4 Accessibility `[PARALLEL]`

- [ ] Implement colorblind mode for combat indicators
- [ ] Add keyboard-only navigation for all menus
- [ ] Create customizable font sizes
- [ ] Implement reduced motion option
- [ ] Ensure all UI elements have proper ARIA labels

---

### Sprint 23-24 (Weeks 45-48): Balance & QA

#### 23.1 Game Balance `[PARALLEL]`

- [ ] Balance combat damage formulas across all levels
- [ ] Adjust XP curves based on beta player data
- [ ] Balance economy: Col income, item prices, enhancement costs
- [ ] Tune monster difficulty: ensure solo-able content and party-required content
- [ ] Balance all 7 character classes for viability
- [ ] Balance weapon types: no clear "best" weapon
- [ ] Adjust skill cooldowns and damage multipliers

#### 23.2 Quality Assurance `[PARALLEL]`

- [ ] Complete playthrough test: Floor 1-25 from level 1-75
- [ ] Stress test: 10,000 concurrent connections, measure latency and stability
- [ ] Security penetration test: attempt speed hacks, packet manipulation, economy exploits
- [ ] Cross-browser test: Chrome, Firefox, Safari, Edge (desktop + mobile)
- [ ] Test reconnection handling: network drops, server restarts
- [ ] Test edge cases: full inventory, 0 HP, simultaneous trades, party in different zones

#### 23.3 Bug Fixing Sprint `[DEPENDS: 23.2]`

- [ ] Triage all bugs by severity (critical, high, medium, low)
- [ ] Fix all critical and high bugs
- [ ] Fix gameplay-affecting medium bugs
- [ ] Document known issues for launch

---

### Sprint 25-26 (Weeks 49-52): Infrastructure & Launch

#### 25.1 Production Infrastructure `[PARALLEL]`

- [ ] Deploy Kubernetes cluster (EKS/GKE) with node groups:
  - game-servers: c6i.2xlarge (8 vCPU, 16 GB) x3-10
  - api-servers: c6i.xlarge (4 vCPU, 8 GB) x2-5
  - workers: c6i.large (2 vCPU, 4 GB) x2-5
- [ ] Deploy RDS PostgreSQL (db.r6g.xlarge) with read replica
- [ ] Deploy ElastiCache Redis cluster (3 masters, 3 replicas)
- [ ] Deploy TimescaleDB on EC2 for analytics
- [ ] Configure NGINX Ingress with WebSocket support (proxy-read-timeout: 3600)
- [ ] Set up Cloudflare: DDoS protection, WAF, CDN for static assets
- [ ] Configure SSL/TLS certificates (Let's Encrypt)
- [ ] Set up S3 for backups (daily full, hourly incremental, continuous WAL archive)

#### 25.2 Monitoring & Alerting `[PARALLEL]`

- [ ] Deploy Prometheus + Grafana stack
- [ ] Create game server dashboard: players online, tick duration, messages/sec, error rate
- [ ] Create infrastructure dashboard: CPU, memory, network, disk
- [ ] Create database dashboard: connections, query latency, replication lag
- [ ] Configure alerts:
  - Tick duration > 20ms for 2min -> warning
  - Error rate > 5% for 2min -> critical
  - Player count unusually low for 10min -> warning
  - DB connection pool > 90% for 2min -> critical
  - Security event spike > 10/sec for 1min -> critical
- [ ] Set up on-call notification: PagerDuty or Slack webhook

#### 25.3 Disaster Recovery `[PARALLEL]`

- [ ] Test PostgreSQL point-in-time recovery procedure
- [ ] Test Redis snapshot restore procedure
- [ ] Verify PodDisruptionBudget: minAvailable=2 for game-servers
- [ ] Test auto-scaling: HPA triggers at 500 players/instance and 70% CPU
- [ ] Test canary deployment: deploy to 1 replica, verify, then full rollout
- [ ] Test rollback procedure: revert to previous deployment in < 5 minutes
- [ ] Document runbooks for all failure scenarios

#### 25.4 Launch Execution `[DEPENDS: 25.1, 25.2, 25.3]`

- [ ] Create launch checklist (derived from 05-SECURITY.md security checklist):
  - [ ] Better Auth configured with BETTER_AUTH_SECRET (256+ bits)
  - [ ] JWT token expiration < 1 hour (via JWT plugin)
  - [ ] All messages validated against schema
  - [ ] Speed hack detection active
  - [ ] Teleportation detection active
  - [ ] Atomic transactions for all economy operations
  - [ ] WSS enforced in production
  - [ ] Origin validation (CSWSH) active
  - [ ] Rate limiting configured for all endpoints
  - [ ] DDoS protection active (Cloudflare)
  - [ ] Passwords hashed by Better Auth (bcrypt/argon2)
  - [ ] Database access restricted (no public endpoints)
  - [ ] Backups running and verified
  - [ ] Monitoring dashboards live
  - [ ] Alerting configured and tested
- [ ] Soft launch: limited regions, 5,000 player cap
- [ ] Monitor metrics for 48 hours
- [ ] Scale up infrastructure
- [ ] Full global launch
- [ ] Post-launch 24/7 monitoring for first week

### Phase 4 Exit Checklist

- [ ] Performance targets met: 60 FPS, < 100ms latency, < 10ms DB queries
- [ ] UI polished with SAO-themed design
- [ ] Sound and visual effects complete
- [ ] All character classes balanced
- [ ] Security checklist 100% complete
- [ ] Stress tested at 10,000+ concurrent players
- [ ] Cross-browser tested
- [ ] Monitoring and alerting operational
- [ ] Disaster recovery tested
- [ ] Global launch successful
- [ ] 50,000+ target DAU

---

## Post-Launch Roadmap

| Update | Timeline | Content |
|--------|----------|---------|
| **v1.1** | Launch +1 month | Floors 26-40, PvP duels, new weapons |
| **v1.2** | Launch +2 months | Floors 41-55, PvP arenas/tournaments, housing |
| **v1.3** | Launch +3 months | Floors 56-74, marriage system, mobile optimization |
| **v1.4** | Launch +4 months | Floors 75-90, large-scale raids, spectator mode |
| **v2.0** | Launch +6 months | Floors 91-100, Final Boss (Heathcliff), endgame content |

---

## Team Allocation Guide

| Role | Phase 0 | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|------|---------|---------|---------|---------|---------|
| Backend (3-4) | Server, DB, WS | Combat, AI, Inventory | Party, Trade, Guild | Crafting, Quests | Performance, Scale |
| Frontend (2-3) | Canvas, Login | Combat UI, HUD | Social UI, Chat | Quest UI, Craft UI | Polish, Sound |
| DevOps (1) | CI/CD, Docker | Staging env | Load testing | Analytics | Production, Launch |
| Game Design (1) | Floor 1 layout | Combat balance | Economy design | Floor design x25 | Final balance |
| QA (1) | Manual testing | Combat QA | Trade/social QA | Content QA | Full regression |

---

## Risk Mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| Scope creep | High | Strict sprint scope, defer nice-to-haves to post-launch |
| WebSocket scalability | Medium | Zone sharding from day 1, binary protocol for hot paths |
| Economy exploits | Medium | Atomic transactions, audit logging, unfair trade detection |
| Performance at scale | Medium | Early load testing (Phase 2), binary protocol, read replicas |
| Effect-TS learning curve | Medium | Pair programming, reference patterns in CLAUDE.md |
| Team burnout | Medium | 2-week sprints, sustainable pace, clear milestones |

---

**This plan is a living document. Update checklist items as work progresses.**
