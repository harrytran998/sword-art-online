# Sword Art Online: Aincrad Online
## Architecture Design Document

**Version:** 1.0.0  
**Date:** February 2026  
**Status:** Planning Phase

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Technology Stack](#2-technology-stack)
3. [System Architecture](#3-system-architecture)
4. [Effect-TS Service Architecture](#4-effect-ts-service-architecture)
5. [WebSocket Server Design](#5-websocket-server-design)
6. [Game Loop Architecture](#6-game-loop-architecture)
7. [State Management](#7-state-management)
8. [Zone/Room Architecture](#8-zoneroom-architecture)
9. [Client Architecture](#9-client-architecture)
10. [Inter-Service Communication](#10-inter-service-communication)
11. [Caching Strategy](#11-caching-strategy)
12. [Logging & Observability](#12-logging--observability)

---

## 1. Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                     │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │ Browser │  │ Browser │  │ Browser │  │ Browser │  │ Mobile  │        │
│  │(Chrome) │  │(Firefox)│  │(Safari) │  │ (Edge)  │  │ Browser │        │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │
└───────┼────────────┼────────────┼────────────┼────────────┼─────────────┘
        │            │            │            │            │
        └────────────┴────────────┼────────────┴────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │      CLOUDFLARE CDN       │
                    │   (DDoS Protection, SSL)  │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │       LOAD BALANCER       │
                    │    (NGINX / Kong / LB)    │
                    └─────────────┬─────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
┌───────────────┐         ┌───────────────┐         ┌───────────────┐
│  GAME SERVER  │         │  GAME SERVER  │         │  GAME SERVER  │
│   INSTANCE 1  │         │   INSTANCE 2  │         │   INSTANCE N  │
│  (Bun + Eff)  │         │  (Bun + Eff)  │         │  (Bun + Eff)  │
│  Zones 1-20   │         │  Zones 21-40  │         │  Zones 81-100 │
└───────┬───────┘         └───────┬───────┘         └───────┬───────┘
        │                         │                         │
        └─────────────────────────┼─────────────────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
┌───────────────┐         ┌───────────────┐         ┌───────────────┐
│   PostgreSQL  │         │    Redis      │         │  TimescaleDB  │
│   (Primary)   │         │   Cluster     │         │  (Analytics)  │
│   Player Data │         │   Hot Data    │         │   Events      │
└───────────────┘         └───────────────┘         └───────────────┘
```

### 1.2 Core Principles

| Principle | Description |
|-----------|-------------|
| **Server-Authoritative** | Server is the absolute source of truth for all game state |
| **Effect-TS Functional** | Pure functional programming with typed effects |
| **Event-Driven** | All state changes emitted as events |
| **Zone-Based Sharding** | Players distributed across servers by floor/zone |
| **Zero-Trust Security** | All inputs validated, no client trust |

---

## 2. Technology Stack

### 2.1 Backend Stack

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Runtime** | Bun | 1.0+ | JavaScript runtime, WebSocket server |
| **Framework** | Effect-TS | 3.0+ | Functional effects, DI, error handling |
| **HTTP** | @effect/platform | 0.50+ | HTTP server with Effect integration |
| **WebSocket** | Bun.serve | Built-in | Native WebSocket with Pub/Sub |
| **Database** | PostgreSQL | 16+ | Primary data store |
| **ORM** | Drizzle | 0.30+ | Type-safe SQL queries |
| **Cache** | Redis | 7.0+ | Session cache, leaderboards, pub/sub |
| **Analytics** | TimescaleDB | 2.0+ | Time-series game events |
| **Message Queue** | Redis Streams | Built-in | Cross-service events |

### 2.2 Frontend Stack

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Framework** | React | 18+ | UI components |
| **State** | Zustand | 4.0+ | Client state management |
| **Renderer** | PixiJS | 8.0+ | WebGL game rendering |
| **Communication** | Native WebSocket | Built-in | Server connection |
| **Styling** | Tailwind CSS | 3.0+ | Utility-first CSS |

### 2.3 Infrastructure Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Container** | Docker | Application containers |
| **Orchestration** | Kubernetes | Container orchestration |
| **Ingress** | NGINX | Load balancing, SSL termination |
| **CDN** | Cloudflare | DDoS protection, static assets |
| **Monitoring** | Prometheus + Grafana | Metrics and dashboards |
| **Logging** | Loki | Log aggregation |
| **Tracing** | Jaeger | Distributed tracing |

---

## 3. System Architecture

### 3.1 Microservices Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         GAME PLATFORM SERVICES                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │
│  │  AUTH SERVICE   │  │  GAME SERVICE   │  │ SOCIAL SERVICE  │          │
│  │                 │  │                 │  │                 │          │
│  │ • Login/OAuth   │  │ • Game Loop     │  │ • Friends       │          │
│  │ • JWT Issuing   │  │ • Combat        │  │ • Guilds        │          │
│  │ • Sessions      │  │ • Movement      │  │ • Chat          │          │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘          │
│           │                    │                    │                   │
│  ┌────────▼────────┐  ┌────────▼────────┐  ┌────────▼────────┐          │
│  │ ECONOMY SERVICE │  │ MATCHMAKING     │  │ ANALYTICS       │          │
│  │                 │  │ SERVICE         │  │ SERVICE         │          │
│  │ • Trading       │  │                 │  │                 │          │
│  │ • Auction House │  │ • Party Queue   │  │ • Events        │          │
│  │ • Transactions  │  │ • Boss Raids    │  │ • Metrics       │          │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Request Flow

```
Client Request Flow:
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────▶│  WSS     │────▶│  Router  │────▶│ Handler  │
│          │     │ Upgrade  │     │  Layer    │     │  Layer   │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                                                          │
                      ┌───────────────────────────────────┘
                      │
         ┌────────────▼────────────┐
         │    EFFECT RUNTIME       │
         │  ┌─────────────────┐    │
         │  │ Service Layer   │    │
         │  │ (Context/Layer) │    │
         │  └────────┬────────┘    │
         │           │             │
         │  ┌────────▼────────┐    │
         │  │ Repository Layer│    │
         │  │ (Data Access)   │    │
         │  └────────┬────────┘    │
         │           │             │
         │  ┌────────▼────────┐    │
         │  │ Database Layer  │    │
         │  │ (Postgres/Redis)│    │
         │  └─────────────────┘    │
         └─────────────────────────┘
```

---

## 4. Effect-TS Service Architecture

### 4.1 Service Definition Pattern

```typescript
// services/player-service.ts
import { Context, Effect, Layer, Data } from "effect"

// 1. Define domain types
interface Player {
  readonly id: string
  readonly name: string
  readonly level: number
  readonly position: Position
  readonly stats: PlayerStats
  readonly inventory: Inventory
}

interface Position {
  readonly x: number
  readonly y: number
  readonly z: number
  readonly floorId: number
  readonly zoneId: string
}

// 2. Define errors
class PlayerNotFoundError extends Data.TaggedError("PlayerNotFoundError")<{
  readonly playerId: string
}> {}

class InvalidPositionError extends Data.TaggedError("InvalidPositionError")<{
  readonly position: Position
  readonly reason: string
}> {}

// 3. Define service contract
class PlayerService extends Context.Tag("PlayerService")<
  PlayerService,
  {
    readonly getPlayer: (id: string) => Effect.Effect<Player, PlayerNotFoundError>
    readonly updatePosition: (id: string, position: Position) => 
      Effect.Effect<void, InvalidPositionError>
    readonly getPlayerStats: (id: string) => Effect.Effect<PlayerStats, PlayerNotFoundError>
    readonly updateStats: (id: string, stats: Partial<PlayerStats>) => 
      Effect.Effect<void, PlayerNotFoundError>
  }
>() {}

// 4. Implement service
const PlayerServiceLive = Layer.effect(
  PlayerService,
  Effect.gen(function* () {
    const database = yield* DatabaseService
    const cache = yield* CacheService
    const validator = yield* PositionValidator
    
    return {
      getPlayer: (id: string) =>
        Effect.gen(function* () {
          // Try cache first
          const cached = yield* cache.get<Player>(`player:${id}`)
          if (cached) return cached
          
          // Fallback to database
          const player = yield* database.query<Player>(
            "SELECT * FROM players WHERE id = $1",
            [id]
          ).pipe(
            Effect.map((rows) => rows[0]),
            Effect.flatMap((player) =>
              player
                ? Effect.succeed(player)
                : Effect.fail(new PlayerNotFoundError({ playerId: id }))
            ),
            Effect.tap((player) => cache.set(`player:${id}`, player, 300))
          )
          
          return player
        }),
        
      updatePosition: (id: string, position: Position) =>
        Effect.gen(function* () {
          // Validate position server-side
          const isValid = yield* validator.validate(position)
          if (!isValid) {
            return yield* Effect.fail(new InvalidPositionError({
              position,
              reason: "Invalid world position"
            }))
          }
          
          // Update database
          yield* database.execute(
            "UPDATE players SET x = $1, y = $2, z = $3, floor_id = $4, zone_id = $5 WHERE id = $6",
            [position.x, position.y, position.z, position.floorId, position.zoneId, id]
          )
          
          // Invalidate cache
          yield* cache.invalidate(`player:${id}`)
        }),
        
      getPlayerStats: (id: string) =>
        Effect.gen(function* () {
          const player = yield* PlayerService.getPlayer(id)
          return player.stats
        }),
        
      updateStats: (id: string, stats: Partial<PlayerStats>) =>
        Effect.gen(function* () {
          yield* database.execute(
            "UPDATE player_stats SET ... WHERE player_id = $1",
            [id]
          )
          yield* cache.invalidate(`player:${id}`)
        })
    }
  })
)
```

### 4.2 Layer Composition (Main Application)

```typescript
// index.ts - Based on HazelChat pattern
import { BunHttpServer, BunRuntime } from "@effect/platform-bun"
import { HttpLayerRouter, HttpServerResponse } from "@effect/platform"
import { Layer, Config } from "effect"

// Import all services
import { PlayerServiceLive } from "./services/player-service"
import { CombatServiceLive } from "./services/combat-service"
import { MovementServiceLive } from "./services/movement-service"
import { WebSocketServiceLive } from "./services/websocket-service"
import { DatabaseLive } from "./services/database"
import { CacheLive } from "./services/cache"
import { GameLoopLive } from "./services/game-loop"

// Compose all service layers
const ServiceLayer = Layer.mergeAll(
  // Core services
  DatabaseLive,
  CacheLive,
  
  // Game services
  PlayerServiceLive,
  CombatServiceLive,
  MovementServiceLive,
  WebSocketServiceLive,
  GameLoopLive
)

// HTTP routes
const HealthRouter = HttpLayerRouter.use((router) =>
  router.add("GET", "/health", HttpServerResponse.text("OK"))
)

// WebSocket upgrade handler
const WebSocketRouter = HttpLayerRouter.use((router) =>
  router.add("GET", "/ws", (request) =>
    Effect.gen(function* () {
      const wsService = yield* WebSocketService
      const upgraded = yield* wsService.handleUpgrade(request)
      return upgraded
    })
  )
)

// Combine routes
const AllRoutes = Layer.mergeAll(HealthRouter, WebSocketRouter)

// Main application
HttpLayerRouter.serve(AllRoutes).pipe(
  Layer.provide(ServiceLayer),
  Layer.provide(
    BunHttpServer.layerConfig(
      Config.all({
        port: Config.number("PORT").pipe(Config.withDefault(8080)),
        reusePort: true, // Enable clustering on Linux
        idleTimeout: 120
      })
    )
  ),
  Layer.launch,
  BunRuntime.runMain
)
```

### 4.3 Service Dependency Graph

```
┌─────────────────────────────────────────────────────────────────┐
│                    SERVICE DEPENDENCY GRAPH                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│    ┌─────────────────────────────────────────────────────┐      │
│    │                  GameLoopService                     │      │
│    │                  (60 Hz ticker)                      │      │
│    └────────────────────┬────────────────────────────────┘      │
│                         │                                        │
│         ┌───────────────┼───────────────┐                       │
│         │               │               │                       │
│         ▼               ▼               ▼                       │
│    ┌─────────┐    ┌──────────┐    ┌───────────┐                 │
│    │ Combat  │    │Movement  │    │   NPC     │                 │
│    │ Service │    │ Service  │    │ Service   │                 │
│    └────┬────┘    └────┬─────┘    └─────┬─────┘                 │
│         │              │                │                        │
│         └──────────────┼────────────────┘                        │
│                        │                                         │
│                        ▼                                         │
│    ┌─────────────────────────────────────────────────┐           │
│    │              PlayerService                       │           │
│    │         (State management, caching)              │           │
│    └────────────────────┬────────────────────────────┘           │
│                         │                                        │
│         ┌───────────────┴───────────────┐                        │
│         │                               │                        │
│         ▼                               ▼                        │
│    ┌─────────────┐               ┌─────────────┐                 │
│    │  Database   │               │   Cache     │                 │
│    │  Service    │               │  Service    │                 │
│    │ (PostgreSQL)│               │  (Redis)    │                 │
│    └─────────────┘               └─────────────┘                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. WebSocket Server Design

### 5.1 Bun WebSocket Configuration

```typescript
// services/websocket-service.ts
import { Context, Effect, Layer, Stream, Queue } from "effect"

interface WebSocketData {
  readonly playerId: string
  readonly sessionToken: string
  readonly connectedAt: number
  readonly zoneId: string
}

class WebSocketService extends Context.Tag("WebSocketService")<
  WebSocketService,
  {
    readonly handleUpgrade: (request: Request) => Effect.Effect<Response>
    readonly broadcast: (type: string, data: unknown) => Effect.Effect<void>
    readonly broadcastToZone: (zoneId: string, type: string, data: unknown) => 
      Effect.Effect<void>
    readonly sendToPlayer: (playerId: string, message: unknown) => Effect.Effect<void>
    readonly messages: Stream.Stream<GameMessage>
  }
>() {}

const WebSocketServiceLive = Layer.effect(
  WebSocketService,
  Effect.gen(function* () {
    const server = yield* HttpServer
    const messageQueue = yield* Queue.unbounded<GameMessage>()
    const connections = new Map<string, ServerWebSocket<WebSocketData>>()
    
    // WebSocket handler configuration
    const websocketHandlers = {
      // Type the data property
      data: {} as WebSocketData,
      
      // Connection opened
      open(ws: ServerWebSocket<WebSocketData>) {
        Effect.runPromise(
          Effect.gen(function* () {
            const playerService = yield* PlayerService
            
            // Verify player exists and is valid
            const player = yield* playerService.getPlayer(ws.data.playerId)
            
            // Subscribe to zones
            ws.subscribe(`zone:${player.position.zoneId}`)
            ws.subscribe(`player:${ws.data.playerId}`)
            
            // Track connection
            connections.set(ws.data.playerId, ws)
            
            // Broadcast player joined zone
            yield* broadcastToZone(
              player.position.zoneId,
              "player_joined",
              { playerId: player.id, name: player.name, position: player.position }
            )
          })
        )
      },
      
      // Message received
      message(ws: ServerWebSocket<WebSocketData>, message: string | Buffer) {
        Effect.runPromise(
          Effect.gen(function* () {
            // Rate limiting check
            const rateLimiter = yield* RateLimiterService
            const allowed = yield* rateLimiter.check(ws.data.playerId)
            if (!allowed) {
              ws.send(JSON.stringify({ type: "error", code: "RATE_LIMITED" }))
              return
            }
            
            // Parse and validate message
            const parsed = yield* parseGameMessage(message)
            const validated = yield* validateMessage(parsed)
            
            // Queue for processing
            yield* Queue.offer(messageQueue, {
              playerId: ws.data.playerId,
              data: validated,
              timestamp: Date.now()
            })
          })
        )
      },
      
      // Connection closed
      close(ws: ServerWebSocket<WebSocketData>, code: number, reason: string) {
        Effect.runPromise(
          Effect.gen(function* () {
            // Cleanup
            connections.delete(ws.data.playerId)
            
            // Broadcast player left
            yield* broadcastToZone(
              ws.data.zoneId,
              "player_left",
              { playerId: ws.data.playerId }
            )
            
            // Unsubscribe from all topics
            ws.unsubscribe(`zone:${ws.data.zoneId}`)
            ws.unsubscribe(`player:${ws.data.playerId}`)
          })
        )
      },
      
      // Backpressure relief
      drain(ws: ServerWebSocket<WebSocketData>) {
        // Socket ready for more data
      }
    }
    
    // Helper functions
    const broadcastToZone = (zoneId: string, type: string, data: unknown) =>
      Effect.sync(() => {
        server.publish(`zone:${zoneId}`, JSON.stringify({ type, data }))
      })
    
    const broadcast = (type: string, data: unknown) =>
      Effect.sync(() => {
        server.publish("global", JSON.stringify({ type, data }))
      })
    
    const sendToPlayer = (playerId: string, message: unknown) =>
      Effect.sync(() => {
        const ws = connections.get(playerId)
        if (ws) {
          ws.send(JSON.stringify(message))
        }
      })
    
    return {
      handleUpgrade: (request: Request) =>
        Effect.gen(function* () {
          const authService = yield* AuthService
          
          // Validate auth token from query params
          const url = new URL(request.url)
          const token = url.searchParams.get("token")
          
          const player = yield* authService.validateToken(token)
          
          // Upgrade connection with player data
          const success = server.upgrade(request, {
            data: {
              playerId: player.id,
              sessionToken: token,
              connectedAt: Date.now(),
              zoneId: player.position.zoneId
            }
          })
          
          if (!success) {
            return new Response("Upgrade failed", { status: 400 })
          }
          
          return new Response(null, { status: 101 }) // Upgrading
        }),
        
      broadcast,
      broadcastToZone,
      sendToPlayer,
      messages: Stream.fromQueue(messageQueue)
    }
  })
)
```

### 5.2 WebSocket Protocol

```typescript
// types/messages.ts

// Client → Server Messages
type ClientMessage =
  | { type: "movement"; direction: Direction; timestamp: number }
  | { type: "skill_activate"; skillId: string; targetId?: string; timestamp: number }
  | { type: "skill_cancel"; skillId: string }
  | { type: "chat"; channel: ChatChannel; message: string }
  | { type: "trade_request"; targetPlayerId: string }
  | { type: "trade_accept"; tradeId: string }
  | { type: "item_use"; itemId: string; targetId?: string }
  | { type: "item_equip"; itemId: string; slot: EquipmentSlot }
  | { type: "heartbeat"; timestamp: number }

// Server → Client Messages
type ServerMessage =
  | { type: "state_update"; entities: EntityUpdate[]; timestamp: number; tick: number }
  | { type: "player_joined"; playerId: string; name: string; position: Position }
  | { type: "player_left"; playerId: string }
  | { type: "player_moved"; playerId: string; position: Position; velocity: Velocity }
  | { type: "skill_executed"; playerId: string; skillId: string; targets: SkillTarget[] }
  | { type: "damage_dealt"; targetId: string; amount: number; sourceId: string }
  | { type: "entity_spawned"; entity: Entity }
  | { type: "entity_despawned"; entityId: string; reason: string }
  | { type: "chat"; channel: ChatChannel; senderId: string; senderName: string; message: string }
  | { type: "inventory_update"; items: InventoryItem[] }
  | { type: "error"; code: ErrorCode; message: string }
  | { type: "heartbeat_ack"; serverTime: number }
```

---

## 6. Game Loop Architecture

### 6.1 Tick-Based Simulation

```typescript
// services/game-loop.ts
import { Context, Effect, Layer, Schedule, Ref } from "effect"

interface GameState {
  readonly tick: number
  readonly entities: Map<string, Entity>
  readonly pendingInputs: Map<string, PlayerInput[]>
}

class GameLoopService extends Context.Tag("GameLoopService")<
  GameLoopService,
  {
    readonly start: Effect.Effect<void>
    readonly stop: Effect.Effect<void>
    readonly getTick: Effect.Effect<number>
  }
>() {}

const TICK_RATE = 60 // 60 Hz
const TICK_INTERVAL = 1000 / TICK_RATE // ~16.67ms

const GameLoopLive = Layer.effect(
  GameLoopService,
  Effect.gen(function* () {
    const movementService = yield* MovementService
    const combatService = yield* CombatService
    const npcService = yield* NpcService
    const websocketService = yield* WebSocketService
    const stateRef = yield* Ref.make<GameState>({
      tick: 0,
      entities: new Map(),
      pendingInputs: new Map()
    })
    
    let running = false
    let tickFiber: Fiber.Fiber<void, never>
    
    const gameTick = Effect.gen(function* () {
      const state = yield* Ref.get(stateRef)
      const newTick = state.tick + 1
      
      // 1. Process all pending inputs
      yield* processInputs(state.pendingInputs)
      
      // 2. Update movement
      yield* movementService.updateAll(state.entities)
      
      // 3. Process combat
      yield* combatService.processCombat(state.entities)
      
      // 4. Update NPCs
      yield* npcService.updateAll()
      
      // 5. Handle collisions
      yield* handleCollisions(state.entities)
      
      // 6. Validate state (anti-cheat)
      yield* validateGameState(state.entities)
      
      // 7. Broadcast updates to clients
      yield* broadcastUpdates(state.entities, newTick)
      
      // 8. Update tick counter
      yield* Ref.update(stateRef, (s) => ({ ...s, tick: newTick }))
    })
    
    const start = Effect.gen(function* () {
      if (running) return
      running = true
      
      // Run game loop at fixed tick rate
      tickFiber = yield* Effect.repeat(
        gameTick,
        Schedule.spaced(`${TICK_INTERVAL} millis`)
      ).pipe(Effect.fork)
      
      yield* Effect.logInfo(`Game loop started at ${TICK_RATE} Hz`)
    })
    
    const stop = Effect.gen(function* () {
      if (!running) return
      running = false
      
      yield* Fiber.interrupt(tickFiber)
      yield* Effect.logInfo("Game loop stopped")
    })
    
    return { start, stop, getTick: Ref.get(stateRef).pipe(Effect.map((s) => s.tick)) }
  })
)
```

### 6.2 Input Processing Pipeline

```typescript
// Input processing with validation at each step
const processInputs = (pendingInputs: Map<string, PlayerInput[]>) =>
  Effect.gen(function* () {
    const movementValidator = yield* MovementValidator
    const combatValidator = yield* CombatValidator
    
    for (const [playerId, inputs] of pendingInputs) {
      for (const input of inputs) {
        // Step 1: Structural validation
        const structureValid = yield* validateInputStructure(input)
        if (!structureValid.valid) {
          yield* logInvalidInput(playerId, input, structureValid.reason)
          continue
        }
        
        // Step 2: Rate limit check
        const rateValid = yield* checkInputRate(playerId, input.type)
        if (!rateValid) {
          continue // Silently drop
        }
        
        // Step 3: Game logic validation
        let processed = false
        switch (input.type) {
          case "movement":
            const moveValid = yield* movementValidator.validate(playerId, input)
            if (moveValid.valid) {
              yield* applyMovement(playerId, input)
              processed = true
            }
            break
            
          case "skill_activate":
            const skillValid = yield* combatValidator.validateSkill(playerId, input)
            if (skillValid.valid) {
              yield* queueSkillExecution(playerId, input)
              processed = true
            }
            break
        }
        
        // Step 4: Log suspicious patterns
        if (!processed) {
          yield* incrementSuspicionScore(playerId)
        }
      }
    }
  })
```

---

## 7. State Management

### 7.1 State Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                      STATE HIERARCHY                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│    ┌─────────────────────────────────────────────────────┐      │
│    │              Global State (Redis)                    │      │
│    │  • Online players count                              │      │
│    │  • Global leaderboards                               │      │
│    │  • System announcements                              │      │
│    └─────────────────────────────────────────────────────┘      │
│                            │                                     │
│    ┌─────────────────────────────────────────────────────┐      │
│    │              Floor State (Redis)                     │      │
│    │  • Floor progress (boss status)                      │      │
│    │  • Floor-specific events                             │      │
│    │  • Player distribution                               │      │
│    └─────────────────────────────────────────────────────┘      │
│                            │                                     │
│    ┌─────────────────────────────────────────────────────┐      │
│    │              Zone State (Memory + Redis)             │      │
│    │  • Player positions                                  │      │
│    │  • Monster spawns                                    │      │
│    │  • Item drops                                        │      │
│    └─────────────────────────────────────────────────────┘      │
│                            │                                     │
│    ┌─────────────────────────────────────────────────────┐      │
│    │              Player State (Postgres + Redis)         │      │
│    │  • Character data                                    │      │
│    │  • Inventory                                         │      │
│    │  • Stats and skills                                  │      │
│    └─────────────────────────────────────────────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 State Synchronization

```typescript
// State sync with delta compression
interface EntityState {
  id: string
  position: Position
  velocity: Velocity
  hp: number
  mp: number
  animationState: string
  lastUpdate: number
}

interface StateUpdate {
  tick: number
  timestamp: number
  updates: EntityState[]
  removed: string[] // IDs of removed entities
}

const broadcastUpdates = (entities: Map<string, EntityState>, tick: number) =>
  Effect.gen(function* () {
    const websocket = yield* WebSocketService
    
    // Group entities by zone
    const entitiesByZone = new Map<string, EntityState[]>()
    
    for (const entity of entities.values()) {
      const zoneId = entity.position.zoneId
      if (!entitiesByZone.has(zoneId)) {
        entitiesByZone.set(zoneId, [])
      }
      entitiesByZone.get(zoneId)!.push(entity)
    }
    
    // Broadcast to each zone
    for (const [zoneId, zoneEntities] of entitiesByZone) {
      const update: StateUpdate = {
        tick,
        timestamp: Date.now(),
        updates: zoneEntities,
        removed: [] // Populated from previous frame comparison
      }
      
      yield* websocket.broadcastToZone(zoneId, "state_update", update)
    }
  })
```

---

## 8. Zone/Room Architecture

### 8.1 Zone Sharding Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                     ZONE SHARDING                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Each Zone = Independent Pub/Sub Topic                          │
│                                                                  │
│  Floor 1:                                                        │
│  ├── zone:floor_1_town          (Town of Beginnings)            │
│  ├── zone:floor_1_field_west    (Western Field)                 │
│  ├── zone:floor_1_field_east    (Eastern Field)                 │
│  ├── zone:floor_1_forest        (First Forest)                  │
│  └── zone:floor_1_labyrinth     (Floor 1 Labyrinth Tower)       │
│                                                                  │
│  Player subscribes to:                                           │
│  ├── zone:{current_zone_id}     (Current zone events)           │
│  ├── player:{player_id}         (Private messages)              │
│  ├── floor:{floor_id}           (Floor-wide announcements)      │
│  └── guild:{guild_id}           (Guild chat, if member)         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Zone Server Assignment

```typescript
// Zone-to-server mapping
interface ZoneAssignment {
  zoneId: string
  serverId: string
  playerCount: number
  lastRebalance: number
}

class ZoneManager {
  // Consistent hashing for zone assignment
  assignZoneToServer(zoneId: string): string {
    const hash = this.hash(zoneId)
    const serverIndex = hash % this.availableServers.length
    return this.availableServers[serverIndex]
  }
  
  // Rebalance when server overloaded
  async rebalanceZones(): Promise<void> {
    for (const [zoneId, assignment] of this.zoneAssignments) {
      if (assignment.playerCount > ZONE_MAX_PLAYERS) {
        // Create duplicate zone on another server
        const newServer = this.findLeastLoadedServer()
        await this.migrateZone(zoneId, newServer)
      }
    }
  }
}
```

---

## 9. Client Architecture

### 9.1 Client Application Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│    ┌─────────────────────────────────────────────────────┐      │
│    │                   UI Layer (React)                   │      │
│    │  • HUD (HP, MP, skills)                              │      │
│    │  • Menus (inventory, character, settings)            │      │
│    │  • Chat                                              │      │
│    └────────────────────────┬────────────────────────────┘      │
│                             │                                    │
│    ┌────────────────────────▼────────────────────────────┐      │
│    │              Game State (Zustand)                    │      │
│    │  • Local player state                                │      │
│    │  • Nearby entities                                   │      │
│    │  • UI state                                          │      │
│    └────────────────────────┬────────────────────────────┘      │
│                             │                                    │
│    ┌────────────────────────▼────────────────────────────┐      │
│    │              Network Layer                           │      │
│    │  • WebSocket connection                              │      │
│    │  • Message queueing                                  │      │
│    │  • Reconnection logic                                │      │
│    │  • Input prediction                                  │      │
│    └────────────────────────┬────────────────────────────┘      │
│                             │                                    │
│    ┌────────────────────────▼────────────────────────────┐      │
│    │              Render Layer (PixiJS)                   │      │
│    │  • Sprite rendering                                  │      │
│    │  • Animation system                                  │      │
│    │  • Particle effects                                  │      │
│    │  • Camera control                                    │      │
│    └─────────────────────────────────────────────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 Client Prediction & Reconciliation

```typescript
// client/network/prediction.ts
class ClientPrediction {
  private inputSequence = 0
  private pendingInputs: PendingInput[] = []
  private serverState: EntityState | null = null
  
  // Send input and predict locally
  processInput(input: PlayerInput): void {
    // Add sequence number
    const seq = this.inputSequence++
    input.sequence = seq
    
    // Apply prediction immediately
    const predictedState = this.applyPrediction(input)
    this.updateLocalState(predictedState)
    
    // Queue for reconciliation
    this.pendingInputs.push({
      sequence: seq,
      input,
      predictedState
    })
    
    // Send to server
    this.sendInput(input)
  }
  
  // Reconcile with server state
  onServerState(serverState: EntityState): void {
    this.serverState = serverState
    
    // Remove acknowledged inputs
    this.pendingInputs = this.pendingInputs.filter(
      (pending) => pending.sequence > serverState.lastProcessedSeq
    )
    
    // Check for misprediction
    const localState = this.getLocalState()
    const delta = this.calculateDelta(localState, serverState)
    
    if (delta.position > RECONCILIATION_THRESHOLD) {
      // Misprediction detected - snap to server state
      this.snapToServerState(serverState)
      
      // Re-apply pending inputs
      for (const pending of this.pendingInputs) {
        const corrected = this.applyPrediction(pending.input)
        this.updateLocalState(corrected)
      }
    }
  }
}
```

---

## 10. Inter-Service Communication

### 10.1 Event Bus Pattern

```typescript
// services/event-bus.ts
import { Context, Effect, Layer, Queue, PubSub } from "effect"

type GameEvent =
  | { type: "player_connected"; playerId: string; zoneId: string }
  | { type: "player_disconnected"; playerId: string; zoneId: string }
  | { type: "monster_killed"; monsterId: string; killerId: string; loot: LootDrop[] }
  | { type: "item_picked_up"; playerId: string; itemId: string }
  | { type: "floor_boss_defeated"; floorId: number; participants: string[] }
  | { type: "trade_completed"; playerA: string; playerB: string; items: TradeItem[] }

class EventBus extends Context.Tag("EventBus")<
  EventBus,
  {
    readonly publish: (event: GameEvent) => Effect.Effect<void>
    readonly subscribe: <K extends GameEvent["type"]>(
      type: K,
      handler: (event: Extract<GameEvent, { type: K }>) => Effect.Effect<void>
    ) => Effect.Effect<void>
  }
>() {}

const EventBusLive = Layer.effect(
  EventBus,
  Effect.gen(function* () {
    const subscribers = new Map<string, Set<(event: GameEvent) => Effect.Effect<void>>>()
    const eventQueue = yield* Queue.unbounded<GameEvent>()
    
    // Process events
    const processEvents = Effect.gen(function* () {
      const event = yield* Queue.take(eventQueue)
      const handlers = subscribers.get(event.type) || new Set()
      
      yield* Effect.forEach(
        Array.from(handlers),
        (handler) => handler(event).pipe(Effect.catchAll(Effect.logError)),
        { concurrency: "unbounded" }
      )
    })
    
    // Start event processing loop
    yield* Effect.repeat(processEvents, Schedule.forever).pipe(Effect.fork)
    
    return {
      publish: (event) => Queue.offer(eventQueue, event),
      subscribe: (type, handler) =>
        Effect.sync(() => {
          if (!subscribers.has(type)) {
            subscribers.set(type, new Set())
          }
          subscribers.get(type)!.add(handler as any)
        })
    }
  })
)
```

---

## 11. Caching Strategy

### 11.1 Cache Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                     CACHING STRATEGY                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│    L1: In-Memory (Per Server)                                  │
│    ┌─────────────────────────────────────────────────────┐      │
│    │  • Active zone state (positions, combat)            │      │
│    │  • Session tokens                                    │      │
│    │  • Rate limit counters                               │      │
│    │  TTL: Seconds (synced between servers)              │      │
│    └─────────────────────────────────────────────────────┘      │
│                                                                  │
│    L2: Redis (Shared)                                          │
│    ┌─────────────────────────────────────────────────────┐      │
│    │  • Player sessions                                   │      │
│    │  • Online player list                                │      │
│    │  • Leaderboards (sorted sets)                        │      │
│    │  • Zone player counts                                │      │
│    │  TTL: Minutes to Hours                               │      │
│    └─────────────────────────────────────────────────────┘      │
│                                                                  │
│    L3: PostgreSQL (Persistent)                                 │
│    ┌─────────────────────────────────────────────────────┐      │
│    │  • Player characters                                 │      │
│    │  • Inventory                                         │      │
│    │  • Quest progress                                    │      │
│    │  • Transaction history                               │      │
│    │  TTL: Forever (with backups)                         │      │
│    └─────────────────────────────────────────────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 11.2 Cache Invalidation

```typescript
// Cache invalidation on state changes
const updatePlayerGold = (playerId: string, amount: number) =>
  Effect.gen(function* () {
    const cache = yield* CacheService
    const database = yield* DatabaseService
    const eventBus = yield* EventBus
    
    // 1. Update database (source of truth)
    yield* database.execute(
      "UPDATE players SET gold = gold + $1 WHERE id = $2",
      [amount, playerId]
    )
    
    // 2. Invalidate cache
    yield* cache.invalidate(`player:${playerId}`)
    
    // 3. Emit event for other services
    yield* eventBus.publish({
      type: "gold_changed",
      playerId,
      amount,
      timestamp: Date.now()
    })
  })
```

---

## 12. Logging & Observability

### 12.1 Structured Logging

```typescript
// services/logger.ts
import { Effect, Logger, LogLevel } from "effect"

const GameLogger = Layer.mergeAll(
  // Console logging for development
  Logger.consoleLogger.pipe(
    Logger.withMinimumLogLevel(LogLevel.Debug)
  ),
  
  // JSON logging for production
  Logger.jsonLogger.pipe(
    Logger.withMinimumLogLevel(LogLevel.Info),
    Logger.withLogAnnotation("service", "game-server"),
    Logger.withLogAnnotation("version", "1.0.0")
  )
)

// Usage in services
const processPlayerAction = (playerId: string, action: PlayerAction) =>
  Effect.gen(function* () {
    yield* Effect.logInfo("Processing player action", {
      playerId,
      action: action.type,
      timestamp: Date.now()
    })
    
    // ... process action
    
    yield* Effect.logDebug("Action processed", {
      playerId,
      action: action.type,
      duration: Date.now() - action.timestamp
    })
  })
```

### 12.2 Metrics Collection

```typescript
// metrics collection with Prometheus
import { Effect, Metric } from "effect"

// Define metrics
const playerCountGauge = Metric.gauge("game_players_online")
const tickDurationHistogram = Metric.histogram("game_tick_duration_millis", {
  boundaries: [1, 5, 10, 16, 20, 30, 50, 100]
})
const messagesPerSecond = Metric.counter("game_messages_total")
const combatEventsCounter = Metric.counter("game_combat_events_total")

// Record metrics in game loop
const gameTick = Effect.gen(function* () {
  const startTime = Date.now()
  
  // ... game logic ...
  
  // Record tick duration
  const duration = Date.now() - startTime
  yield* Metric.update(tickDurationHistogram, duration)
  
  // Record player count
  const playerCount = yield* getPlayerCount()
  yield* Metric.set(playerCountGauge, playerCount)
})
```

---

## Appendix A: Configuration

```typescript
// config/index.ts
import { Config, Layer } from "effect"

const AppConfig = Config.all({
  server: Config.all({
    port: Config.number("PORT").pipe(Config.withDefault(8080)),
    host: Config.string("HOST").pipe(Config.withDefault("0.0.0.0")),
    reusePort: Config.boolean("REUSE_PORT").pipe(Config.withDefault(true)),
    idleTimeout: Config.number("IDLE_TIMEOUT").pipe(Config.withDefault(120))
  }),
  
  database: Config.all({
    host: Config.string("DB_HOST"),
    port: Config.number("DB_PORT").pipe(Config.withDefault(5432)),
    name: Config.string("DB_NAME"),
    user: Config.string("DB_USER"),
    password: Config.secret("DB_PASSWORD"),
    poolSize: Config.number("DB_POOL_SIZE").pipe(Config.withDefault(20))
  }),
  
  redis: Config.all({
    host: Config.string("REDIS_HOST").pipe(Config.withDefault("localhost")),
    port: Config.number("REDIS_PORT").pipe(Config.withDefault(6379)),
    password: Config.option(Config.secret("REDIS_PASSWORD"))
  }),
  
  game: Config.all({
    tickRate: Config.number("TICK_RATE").pipe(Config.withDefault(60)),
    maxPlayersPerZone: Config.number("MAX_PLAYERS_PER_ZONE").pipe(Config.withDefault(500)),
    maxMessageSize: Config.number("MAX_MESSAGE_SIZE").pipe(Config.withDefault(65536))
  })
})
```

---

**Document Version:** 1.0.0  
**Last Updated:** February 2026  
**Owner:** Architecture Team
