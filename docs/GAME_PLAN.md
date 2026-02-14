# Sword Art Online MMORPG - Comprehensive Development Plan

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Product Requirements Document](#2-product-requirements-document)
3. [System Architecture](#3-system-architecture)
4. [Database Design](#4-database-design)
5. [API/Network Protocol](#5-apinetwork-protocol)
6. [Security Architecture](#6-security-architecture)
7. [Deployment Infrastructure](#7-deployment-infrastructure)
8. [Development Roadmap](#8-development-roadmap)

---

## 1. Executive Summary

### 1.1 Project Overview
**Project Name**: Sword Art Online
**Genre**: Browser-based Action MMORPG  
**Tech Stack**: Bun WebSocket + Effect-TS + PostgreSQL + Redis  
**Architecture**: Server-authoritative real-time multiplayer

### 1.2 Core Vision
Create an authentic Sword Art Online gaming experience featuring:
- 100-floor floating castle Aincrad (progressive content unlock)
- Sword Skills system with pre/post-motion mechanics
- Server-authoritative combat preventing all client-side cheating
- Real-time WebSocket-based multiplayer (7x faster than Node.js)
- Effect-TS functional programming for type-safe, composable game logic

### 1.3 Key Metrics
- **Target**: 10,000 concurrent players per shard
- **Latency**: <50ms for combat actions
- **Tick Rate**: 20Hz server simulation
- **Security**: Zero tolerance for speed hacks, item duplication, teleportation

---

## 2. Product Requirements Document

### 2.1 Core Game Features

#### 2.1.1 Aincrad World Structure
```
Floor Layout (100 Floors Total):
├── Floor 1: Starter Town (Beginner Training)
├── Floors 2-10: Low-level content (Level 1-20)
├── Floors 11-25: Mid-level content (Level 21-50)
├── Floors 26-50: High-level content (Level 51-80)
├── Floors 51-75: Endgame content (Level 81-95)
├── Floors 76-99: Hardcore content (Level 96-99)
└── Floor 100: Final Boss (Level 100)

Each Floor Contains:
- 1 Main Settlement (Safe Zone, PvP disabled)
- 1 Floor Boss Room (Locked until labyrinth cleared)
- 3-5 Labyrinth Areas (Dungeon progression)
- 5-10 Field Areas (Open world, resource gathering)
- 1-2 Hidden Areas (Secret bosses, rare materials)
```

#### 2.1.2 Character System

**Attributes (Primary)**:
| Attribute | Effect | Base Range |
|-----------|--------|------------|
| STR | Physical damage, carry weight | 10-100 |
| AGI | Attack speed, evasion | 10-100 |
| DEX | Accuracy, crit rate | 10-100 |
| VIT | HP, defense | 10-100 |
| INT | Magic damage, MP | 10-100 |
| LUK | Drop rate, rare finds | 10-100 |

**Character Progression**:
- Level Cap: 100 (matching 100 floors)
- EXP scaling: exponential curve (1000 EXP Lv1 → 1,000,000 EXP Lv100)
- Skill points: 3 per level, totaling 297 points
- Death penalty: Loss of 10% current level EXP (but NOT level down)

#### 2.1.3 Sword Skills System (SAO Authentic)

**Skill Activation Sequence**:
```
1. Pre-Motion (300-800ms)
   - Player initiates skill stance
   - System validates: MP cost, cooldown, valid target
   - Visual glow effect begins
   
2. System Recognition (100ms)
   - Server acknowledges and locks state
   - Animation begins on all clients
   
3. Auto-Execution (200-2000ms depending on skill)
   - System guides character through optimal motion
   - Hit detection server-side only
   - Damage calculated and applied
   
4. Post-Motion Vulnerability (300-1500ms)
   - Character frozen in recovery animation
   - No movement or skill use possible
   - Critical vulnerability window
   
5. Cooldown Period
   - Skill enters cooldown
   - Global cooldown: 200ms between any skills
```

**Weapon Types & Skill Trees**:
```yaml
One-Handed Sword:
  - Horizontal Slash (1-hit, fast)
  - Vertical Slash (1-hit, high damage)
  - Slant (Diagonal, armor penetration)
  - Vorpal Strike (Linear dash attack)
  - Starburst Stream (16-hit combo - ULTIMATE)

One-Handed Curved Sword:
  - Reaver (Wide arc)
  - Fell Crescent (360° spin)
  - Snake Bite (Double hit, poison)

Rapier:
  - Linear (Fast thrust)
  - Meteor Break (Aerial combo)
  - Starlight Stream (Rapid 11-hit)

Dagger:
  - Fad Edge (Stealth opener)
  - Criminal Brand (Backstab bonus)
  - Thousand Rain (AoE around target)

Two-Handed:
  - Avalanche (Slow, massive damage)
  - Double Circular (Spinning AoE)
  - Ground Gorge (Earthquake effect)

Katana:
  - Tsujikaze (Wind slice projectile)
  - Tsumujiguruma (Tornado spin)
  - Gengetsu (Illusion strike)
```

#### 2.1.4 Equipment Enhancement System

**Enhancement Parameters** (5 for each weapon):
| Parameter | Effect | Max Value |
|-----------|--------|-----------|
| Sharpness | Physical damage bonus | +50% |
| Accuracy | Hit rate increase | +25% |
| Quickness | Attack speed | +20% |
| Heaviness | Stagger/knockback | +30% |
| Durability | Weapon HP | +100% |

**Enhancement Mechanics**:
- Max enhancement level: +10
- Success rate decreases per level (90% → 10%)
- Failure: Rollback to nearest safe point (+3, +6, +9)
- Critical failure: Weapon durability loss
- Enhancement materials drop from bosses/rare mobs

#### 2.1.5 Party & Guild System

**Party System**:
- Max party size: 6 players
- EXP sharing: 100% to killer, 50% distributed to nearby party members
- Item distribution: Round-robin, Need/Greed, or Leader
- Party skills: Buffs, resurrection (with penalty)

**Guild System**:
- Formation cost: 100,000 Col
- Max members: 48 (matching SAO raid size)
- Guild facilities: Storage, crafting stations, buffs
- Guild wars: Weekly tournaments for floor control
- Guild ranks: Leader, Sub-Leader, Officer, Member, Recruit

#### 2.1.6 Boss System

**Boss Types**:
```yaml
Field Bosses:
  - Spawn: Random intervals (2-6 hours)
  - HP Bars: 2-4
  - Loot: Rare materials, moderate Col
  - Difficulty: Soloable to small party

Mid-Bosses:
  - Location: Labyrinth mid-points
  - HP Bars: 4-6
  - Loot: Boss-specific equipment
  - Difficulty: Full party recommended

Floor Bosses:
  - Location: End of each floor labyrinth
  - HP Bars: 6-10 (scales with floor)
  - Mechanics: Multiple phases, adds spawning
  - Loot: Floor-clearing items, legendary gear
  - Difficulty: Requires 2+ parties (12+ players)
  
Secret Bosses:
  - Location: Hidden areas
  - HP Bars: 8-12
  - Loot: Unique cosmetics, titles, rare mats
  - Difficulty: High-end raid content
```

**Boss HP Bar Mechanics**:
- Each bar represents ~20-25% of total HP
- Yellow bars: Normal phase
- Red bars: Enrage mechanics activated
- Last bar: Special ultimate attack pattern
- Break mechanics: Interruptible during specific windows

#### 2.1.7 Economy System

**Currency**:
| Unit | Value | Description |
|------|-------|-------------|
| Col | 1 | Base currency |
| Silver | 100 | 100 Col |
| Gold | 500 | 500 Col |
| Large Gold | 100,000 | Boss/quest reward |

**Economy Sources**:
- Mob drops: 1-50 Col (common mobs)
- Quest rewards: 100-5,000 Col
- Boss drops: 1,000-50,000 Col
- Player trading: Market-based
- Crafting: Material → Item value add

**Economy Sinks**:
- Equipment enhancement (scalable cost)
- Fast travel (Col per distance)
- Guild maintenance (weekly)
- Consumable crafting
- Equipment repairs

### 2.2 User Stories

#### Core Player Experience
```
As a new player, I want to:
- Create a character with customizable appearance
- Complete a tutorial that teaches Sword Skills mechanics
- Progress through floors to unlock new content
- Join parties to tackle difficult content
- Participate in boss raids for rare rewards

As a veteran player, I want to:
- Optimize my build with skill points and equipment
- Complete high-floor content solo as a challenge
- Participate in guild wars and competitive content
- Trade rare items on the player market
- Achieve 100% completion (all floors, all skills)
```

#### Social Features
```
As a player, I want to:
- Form parties with nearby players
- Join guilds for community and benefits
- Chat in global, party, guild, and whisper channels
- Trade items and Col with other players
- Add friends and see their online status
```

#### Combat & Skills
```
As a combat-focused player, I want to:
- Master the timing of Sword Skills
- Chain skills together for combos
- Dodge and counter enemy attacks
- Participate in large-scale boss battles
- Earn recognition on leaderboards
```

### 2.3 Non-Functional Requirements

**Performance**:
- Server tick rate: 20Hz (50ms intervals)
- Client update rate: 60 FPS minimum
- Network latency: <100ms (regional servers)
- Concurrent players: 10,000 per shard

**Security**:
- Zero client-side authority
- All combat calculations server-side
- Encrypted WebSocket connections (WSS)
- Rate limiting on all endpoints
- Anti-cheat detection for speed hacks, teleportation

**Reliability**:
- 99.9% uptime SLA
- Graceful degradation during high load
- Player state persistence every 30 seconds
- Rollback protection for economy transactions

---

## 3. System Architecture

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Browser    │  │   Browser    │  │   Browser    │       │
│  │   (Phaser3)  │  │   (Phaser3)  │  │   (Phaser3)  │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
└─────────┼─────────────────┼─────────────────┼───────────────┘
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │ WSS (TLS 1.3)
┌───────────────────────────▼───────────────────────────────┐
│                     LOAD BALANCER                          │
│              (Cloudflare / AWS ALB / Nginx)                │
└───────────────────────────┬───────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
┌─────────▼────────┐ ┌──────▼──────┐ ┌───────▼────────┐
│  GAME SERVER 1   │ │ GAME SRV 2  │ │  GAME SERVER N │
│  (Bun + WS)      │ │ (Bun + WS)  │ │  (Bun + WS)    │
│                  │ │             │ │                │
│  ┌────────────┐  │ │ ┌─────────┐ │ │ ┌────────────┐ │
│  │ Connection │  │ │ │Connection│ │ │ │ Connection │ │
│  │  Manager   │  │ │ │ Manager │ │ │ │  Manager   │ │
│  └────────────┘  │ │ └─────────┘ │ │ └────────────┘ │
│  ┌────────────┐  │ │ ┌─────────┐ │ │ ┌────────────┐ │
│  │  Spatial   │  │ │ │ Spatial │ │ │ │  Spatial   │ │
│  │  Partition │  │ │ │Partition│ │ │ │  Partition │ │
│  └────────────┘  │ │ └─────────┘ │ │ └────────────┘ │
│  ┌────────────┐  │ │ ┌─────────┐ │ │ ┌────────────┐ │
│  │   Combat   │  │ │ │ Combat  │ │ │ │   Combat   │ │
│  │  Engine    │  │ │ │ Engine  │ │ │ │  Engine    │ │
│  └────────────┘  │ │ └─────────┘ │ │ └────────────┘ │
└────────┬─────────┘ └──────┬──────┘ └────────┬───────┘
         │                  │                 │
         └──────────────────┼─────────────────┘
                            │
┌───────────────────────────▼───────────────────────────────┐
│                     REDIS CLUSTER                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Sessions │  │  State   │  │ Pub/Sub  │  │  Cache   │   │
│  │   (TTL)  │  │  Cache   │  │   (WS)   │  │  (Hot)   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└───────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────▼───────────────────────────────┐
│                  POSTGRESQL CLUSTER                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Player  │  │  World   │  │ Economy  │  │  Event   │   │
│  │   Data   │  │   Data   │  │   Data   │  │   Log    │   │
│  │(Sharded) │  │(Sharded) │  │(Atomic)  │  │(Append)  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└───────────────────────────────────────────────────────────┘
```

### 3.2 Bun WebSocket Server Architecture

#### 3.2.1 Server Initialization

```typescript
// src/server.ts
import { BunRuntime } from "@effect/platform-bun"
import { Layer, Effect, pipe } from "effect"
import { WebSocketServer } from "./websocket/server"
import { GameService } from "./services/game"
import { PlayerRepository } from "./repositories/player"
import { RedisService } from "./services/redis"
import { ConfigService } from "./services/config"

// Configuration layer
const ConfigLayer = ConfigService.layer({
  port: 3000,
  redisUrl: process.env.REDIS_URL!,
  dbUrl: process.env.DATABASE_URL!,
  tickRate: 20, // 20Hz = 50ms
  maxConnections: 10000,
})

// Infrastructure layers
const RedisLayer = RedisService.layer.pipe(
  Layer.provide(ConfigLayer)
)

const DatabaseLayer = PlayerRepository.layer.pipe(
  Layer.provide(ConfigLayer)
)

// Business logic layers
const GameLayer = GameService.layer.pipe(
  Layer.provide(RedisLayer),
  Layer.provide(DatabaseLayer)
)

// WebSocket server layer
const ServerLayer = WebSocketServer.layer.pipe(
  Layer.provide(GameLayer),
  Layer.provide(ConfigLayer)
)

// Compose all layers
const AppLayer = Layer.mergeAll(
  ConfigLayer,
  RedisLayer,
  DatabaseLayer,
  GameLayer,
  ServerLayer
)

// Run the application
const program = Effect.gen(function* () {
  const server = yield* WebSocketServer
  yield* server.start()
})

pipe(
  program,
  Effect.provide(AppLayer),
  BunRuntime.runMain
)
```

#### 3.2.2 WebSocket Handler (Bun Native)

```typescript
// src/websocket/server.ts
import type { ServerWebSocket } from "bun"
import { Effect, Layer, Context, Ref, Queue, Stream, Schedule } from "effect"
import { Data } from "effect"

// Define the WebSocket data structure
interface WSData {
  playerId: string | null
  authenticated: boolean
  lastPing: number
  messageNonce: number
  rateLimitBucket: number
}

// Custom errors
class AuthenticationError extends Data.TaggedError("AuthenticationError")<{
  message: string
}> {}

class RateLimitError extends Data.TaggedError("RateLimitError")<{
  retryAfter: number
}> {}

// Message types for protocol
interface ClientMessage {
  type: string
  nonce: number
  timestamp: number
  payload: unknown
  signature?: string
}

interface ServerMessage {
  type: string
  timestamp: number
  payload: unknown
}

// WebSocket service interface
export interface WebSocketServerService {
  readonly start: Effect.Effect<void, never, never>
  readonly broadcast: (
    message: ServerMessage,
    filter?: (data: WSData) => boolean
  ) => Effect.Effect<void, never, never>
  readonly sendToPlayer: (
    playerId: string,
    message: ServerMessage
  ) => Effect.Effect<void, never, never>
}

export const WebSocketServer = Context.Tag<WebSocketServerService>(
  "WebSocketServer"
)

// Connection registry
interface ConnectionRegistry {
  connections: Map<string, ServerWebSocket<WSData>>
  playerConnections: Map<string, ServerWebSocket<WSData>>
}

// Implementation
export const WebSocketServerLive = Layer.effect(
  WebSocketServer,
  Effect.gen(function* () {
    // Use Ref for mutable state in Effect
    const registryRef = yield* Ref.make<ConnectionRegistry>({
      connections: new Map(),
      playerConnections: new Map(),
    })

    // Message queue for processing
    const messageQueue = yield* Queue.unbounded<{
      ws: ServerWebSocket<WSData>
      message: ClientMessage
    }>()

    // Rate limiting bucket refill (every 100ms)
    const rateLimitSchedule = Schedule.fixed("100 millis")
    
    yield* Effect.fork(
      Effect.repeat(
        Effect.gen(function* () {
          const registry = yield* Ref.get(registryRef)
          for (const [id, ws] of registry.connections) {
            const data = ws.data
            if (data.rateLimitBucket < 100) {
              ws.data = { ...data, rateLimitBucket: data.rateLimitBucket + 1 }
            }
          }
        }),
        rateLimitSchedule
      )
    )

    // Bun WebSocket handler
    const websocketHandler = {
      message(ws: ServerWebSocket<WSData>, message: string | Buffer) {
        Effect.runFork(
          Effect.gen(function* () {
            // Rate limit check
            if (ws.data.rateLimitBucket <= 0) {
              yield* sendError(ws, "RATE_LIMITED", { retryAfter: 1000 })
              return
            }
            ws.data.rateLimitBucket--

            // Parse message
            const parsed = yield* Effect.try({
              try: () => JSON.parse(message.toString()),
              catch: () => new Error("Invalid JSON"),
            })

            // Validate message structure
            if (!isValidClientMessage(parsed)) {
              yield* sendError(ws, "INVALID_MESSAGE", {})
              return
            }

            // Replay protection (nonce check)
            if (parsed.nonce <= ws.data.messageNonce) {
              yield* sendError(ws, "INVALID_NONCE", {})
              return
            }
            ws.data.messageNonce = parsed.nonce

            // Queue for processing
            yield* Queue.offer(messageQueue, { ws, message: parsed })
          })
        )
      },

      open(ws: ServerWebSocket<WSData>) {
        Effect.runFork(
          Effect.gen(function* () {
            ws.data = {
              playerId: null,
              authenticated: false,
              lastPing: Date.now(),
              messageNonce: 0,
              rateLimitBucket: 100,
            }

            yield* Ref.update(registryRef, (reg) => ({
              ...reg,
              connections: new Map([...reg.connections, [ws.remoteAddress, ws]]),
            }))

            yield* sendMessage(ws, {
              type: "CONNECTED",
              timestamp: Date.now(),
              payload: { serverTime: Date.now() },
            })
          })
        )
      },

      close(ws: ServerWebSocket<WSData>, code: number, reason: string) {
        Effect.runFork(
          Effect.gen(function* () {
            const registry = yield* Ref.get(registryRef)
            
            // Clean up player connection
            if (ws.data.playerId) {
              registry.playerConnections.delete(ws.data.playerId)
              // Notify game service of disconnect
              yield* handleDisconnect(ws.data.playerId)
            }
            
            registry.connections.delete(ws.remoteAddress)
          })
        )
      },
    }

    // Start Bun server
    const start = Effect.sync(() => {
      Bun.serve({
        port: 3000,
        websocket: websocketHandler,
        fetch(req, server) {
          // Upgrade to WebSocket
          if (server.upgrade(req)) {
            return undefined
          }
          return new Response("WebSocket server", { status: 426 })
        },
      })
      console.log("WebSocket server started on port 3000")
    })

    // Message processing loop
    const processMessages = Stream.fromQueue(messageQueue).pipe(
      Stream.mapEffect(({ ws, message }) => 
        handleMessage(ws, message)
      ),
      Stream.runDrain
    )

    // Start message processor
    yield* Effect.fork(processMessages)

    return WebSocketServer.of({
      start,
      broadcast: (msg, filter) =>
        Effect.gen(function* () {
          const registry = yield* Ref.get(registryRef)
          for (const [_, ws] of registry.connections) {
            if (!filter || filter(ws.data)) {
              yield* sendMessage(ws, msg)
            }
          }
        }),
      sendToPlayer: (playerId, msg) =>
        Effect.gen(function* () {
          const registry = yield* Ref.get(registryRef)
          const ws = registry.playerConnections.get(playerId)
          if (ws) {
            yield* sendMessage(ws, msg)
          }
        }),
    })
  })
)

// Helper functions
function sendMessage(
  ws: ServerWebSocket<WSData>,
  message: ServerMessage
): Effect.Effect<void, never, never> {
  return Effect.sync(() => {
    const result = ws.send(JSON.stringify(message))
    if (result === 0) {
      // Message dropped due to backpressure
      console.warn(`Message dropped for ${ws.remoteAddress}`)
    }
  })
}

function sendError(
  ws: ServerWebSocket<WSData>,
  code: string,
  details: Record<string, unknown>
): Effect.Effect<void, never, never> {
  return sendMessage(ws, {
    type: "ERROR",
    timestamp: Date.now(),
    payload: { code, ...details },
  })
}

function isValidClientMessage(msg: unknown): msg is ClientMessage {
  return (
    typeof msg === "object" &&
    msg !== null &&
    "type" in msg &&
    "nonce" in msg &&
    "timestamp" in msg &&
    "payload" in msg
  )
}

function handleMessage(
  ws: ServerWebSocket<WSData>,
  message: ClientMessage
): Effect.Effect<void, never, never> {
  // Route to appropriate handler based on message type
  return Effect.unit
}

function handleDisconnect(playerId: string): Effect.Effect<void, never, never> {
  return Effect.unit
}
```

### 3.3 Effect-TS Service Architecture

#### 3.3.1 Service Composition Pattern

```typescript
// src/services/index.ts
import { Layer } from "effect"
import { ConfigServiceLive } from "./config"
import { RedisServiceLive } from "./redis"
import { DatabaseServiceLive } from "./database"
import { GameServiceLive } from "./game"
import { CombatServiceLive } from "./combat"
import { EconomyServiceLive } from "./economy"
import { ChatServiceLive } from "./chat"
import { AuthServiceLive } from "./auth"

// Infrastructure layer (no dependencies)
const InfrastructureLayer = Layer.merge(
  ConfigServiceLive,
  RedisServiceLive,
  DatabaseServiceLive
)

// Business logic layer (depends on infrastructure)
const BusinessLogicLayer = Layer.mergeAll(
  AuthServiceLive,
  CombatServiceLive,
  EconomyServiceLive,
  ChatServiceLive
).pipe(Layer.provide(InfrastructureLayer))

// Game service (top-level orchestrator)
const GameLayer = GameServiceLive.pipe(
  Layer.provide(BusinessLogicLayer)
)

// Complete application layer
export const AppLayer = Layer.mergeAll(
  InfrastructureLayer,
  BusinessLogicLayer,
  GameLayer
)
```

#### 3.3.2 Game Loop Service

```typescript
// src/services/game-loop.ts
import { Effect, Schedule, Stream, Ref, Queue, Fiber } from "effect"
import { Data } from "effect"

// Game state
type GameState = {
  tick: number
  lastUpdate: number
  entities: Map<string, Entity>
  spatialIndex: SpatialIndex
}

// Errors
class GameLoopError extends Data.TaggedError("GameLoopError")<{
  cause: string
  tick: number
}> {}

// Game loop implementation
export const createGameLoop = (
  tickRate: number
) =>
  Effect.gen(function* () {
    const tickInterval = 1000 / tickRate // ms per tick
    const stateRef = yield* Ref.make<GameState>({
      tick: 0,
      lastUpdate: Date.now(),
      entities: new Map(),
      spatialIndex: new SpatialIndex(),
    })

    // Process player inputs
    const inputQueue = yield* Queue.unbounded<PlayerInput>()

    // Game loop tick
    const tick = Effect.gen(function* () {
      const startTime = Date.now()
      const state = yield* Ref.get(stateRef)
      
      // 1. Process inputs
      const inputs = yield* Queue.takeAll(inputQueue)
      yield* processInputs(inputs, state)
      
      // 2. Update physics/movement
      yield* updatePhysics(state)
      
      // 3. Process combat
      yield* processCombat(state)
      
      // 4. Update AI
      yield* updateAI(state)
      
      // 5. Sync state to clients
      yield* syncState(state)
      
      // 6. Persist critical state
      yield* persistState(state)
      
      // Update tick counter
      yield* Ref.update(stateRef, (s) => ({
        ...s,
        tick: s.tick + 1,
        lastUpdate: Date.now(),
      }))
      
      // Calculate and log tick time
      const tickTime = Date.now() - startTime
      if (tickTime > tickInterval) {
        yield* Effect.logWarning(
          `Tick ${state.tick} exceeded target: ${tickTime}ms > ${tickInterval}ms`
        )
      }
    })

    // Schedule game loop
    const loop = Effect.repeat(
      tick,
      Schedule.fixed(`${tickInterval} millis`)
    )

    // Start loop in background fiber
    const fiber = yield* Effect.fork(loop)

    return {
      submitInput: (input: PlayerInput) => Queue.offer(inputQueue, input),
      stop: () => Fiber.interrupt(fiber),
    }
  })

// Process batched player inputs
const processInputs = (
  inputs: PlayerInput[],
  state: GameState
): Effect.Effect<void, never, never> =>
  Effect.forEach(inputs, (input) => {
    // Validate and apply each input
    return validateAndApplyInput(input, state)
  }, { discard: true })

// Update entity positions with server-authoritative physics
const updatePhysics = (
  state: GameState
): Effect.Effect<void, never, never> =>
  Effect.gen(function* () {
    for (const [id, entity] of state.entities) {
      if (entity.type === "player") {
        // Validate movement speed (anti-speed-hack)
        const maxDistance = entity.stats.speed * (50 / 1000) // max per tick
        const actualDistance = calculateDistance(
          entity.position,
          entity.targetPosition
        )
        
        if (actualDistance > maxDistance * 1.1) { // 10% tolerance
          // Reject movement - possible speed hack
          yield* Effect.logWarning(
            `Speed hack detected: player ${id} moved ${actualDistance} (max ${maxDistance})`
          )
          // Snap back to valid position
          entity.position = entity.lastValidPosition
        } else {
          // Accept movement
          entity.position = entity.targetPosition
          entity.lastValidPosition = entity.position
        }
      }
    }
    
    // Update spatial index
    state.spatialIndex.rebuild(state.entities)
  })

// Process combat calculations (server-authoritative)
const processCombat = (
  state: GameState
): Effect.Effect<void, never, never> =>
  Effect.gen(function* () {
    // Process active skill executions
    for (const [id, entity] of state.entities) {
      if (entity.activeSkill) {
        yield* processSkillExecution(entity, state)
      }
    }
    
    // Check for damage application
    for (const damageEvent of state.pendingDamage) {
      yield* applyDamage(damageEvent, state)
    }
  })

// Update AI behavior
const updateAI = (
  state: GameState
): Effect.Effect<void, never, never> =>
  Effect.forEach(
    Array.from(state.entities.values()).filter((e) => e.type === "npc"),
    (npc) => updateNPCBehavior(npc, state),
    { discard: true }
  )

// Sync state to relevant clients
const syncState = (
  state: GameState
): Effect.Effect<void, never, never> =>
  Effect.gen(function* () {
    // Delta compression: only send changed values
    const changes = calculateDelta(state)
    
    // Spatial partitioning: only send to players in range
    for (const [playerId, player] of state.entities) {
      if (player.type === "player") {
        const nearbyChanges = filterByProximity(changes, player.position)
        yield* sendStateUpdate(playerId, nearbyChanges)
      }
    }
  })

// Persist critical state to database
const persistState = (
  state: GameState
): Effect.Effect<void, never, never> =>
  Effect.gen(function* () {
    // Batch persistence every N ticks
    if (state.tick % 600 === 0) { // Every 30 seconds at 20Hz
      yield* persistPlayerData(state)
    }
  })
```

#### 3.3.3 Spatial Partitioning Service

```typescript
// src/services/spatial.ts
import { Effect } from "effect"

// Grid-based spatial partitioning for efficient proximity queries
const CELL_SIZE = 100 // meters

class SpatialIndex {
  private grid: Map<string, Set<string>> = new Map()
  private entityCells: Map<string, string> = new Map()

  // Get cell key from position
  private getCellKey(x: number, y: number): string {
    const cellX = Math.floor(x / CELL_SIZE)
    const cellY = Math.floor(y / CELL_SIZE)
    return `${cellX},${cellY}`
  }

  // Get all cells within radius
  getCellsInRadius(x: number, y: number, radius: number): string[] {
    const cells: string[] = []
    const startX = Math.floor((x - radius) / CELL_SIZE)
    const endX = Math.floor((x + radius) / CELL_SIZE)
    const startY = Math.floor((y - radius) / CELL_SIZE)
    const endY = Math.floor((y + radius) / CELL_SIZE)

    for (let cx = startX; cx <= endX; cx++) {
      for (let cy = startY; cy <= endY; cy++) {
        cells.push(`${cx},${cy}`)
      }
    }
    return cells
  }

  // Add entity to index
  add(id: string, x: number, y: number): void {
    const cellKey = this.getCellKey(x, y)
    
    if (!this.grid.has(cellKey)) {
      this.grid.set(cellKey, new Set())
    }
    
    this.grid.get(cellKey)!.add(id)
    this.entityCells.set(id, cellKey)
  }

  // Update entity position
  update(id: string, x: number, y: number): void {
    const oldCell = this.entityCells.get(id)
    const newCell = this.getCellKey(x, y)
    
    if (oldCell !== newCell) {
      // Remove from old cell
      if (oldCell && this.grid.has(oldCell)) {
        this.grid.get(oldCell)!.delete(id)
      }
      
      // Add to new cell
      if (!this.grid.has(newCell)) {
        this.grid.set(newCell, new Set())
      }
      this.grid.get(newCell)!.add(id)
      this.entityCells.set(id, newCell)
    }
  }

  // Get entities within radius
  queryRadius(x: number, y: number, radius: number): string[] {
    const cells = this.getCellsInRadius(x, y, radius)
    const results: string[] = []
    
    for (const cellKey of cells) {
      const cell = this.grid.get(cellKey)
      if (cell) {
        results.push(...cell)
      }
    }
    
    return results
  }

  // Rebuild entire index
  rebuild(entities: Map<string, Entity>): void {
    this.grid.clear()
    this.entityCells.clear()
    
    for (const [id, entity] of entities) {
      this.add(id, entity.position.x, entity.position.y)
    }
  }
}
```

---

## 4. Database Design

### 4.1 PostgreSQL Schema

#### 4.1.1 Core Tables

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Players table (sharded by player_id)
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(32) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_banned BOOLEAN DEFAULT FALSE,
    ban_reason TEXT,
    
    -- Character data (JSONB for flexibility)
    character_data JSONB NOT NULL DEFAULT '{
        "name": "",
        "level": 1,
        "exp": 0,
        "stats": {
            "str": 10,
            "agi": 10,
            "dex": 10,
            "vit": 10,
            "int": 10,
            "luk": 10
        },
        "skill_points": 0,
        "skill_trees": {},
        "position": {"floor": 1, "x": 0, "y": 0, "z": 0},
        "hp": 100,
        "mp": 50,
        "col": 0
    }'::jsonb,
    
    -- Indexes
    CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]{3,32}$')
);

-- Create index for common queries
CREATE INDEX idx_players_username ON players(username);
CREATE INDEX idx_players_last_login ON players(last_login);
CREATE INDEX idx_players_character_data ON players USING GIN(character_data);

-- Player authentication sessions
CREATE TABLE player_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_sessions_player ON player_sessions(player_id);
CREATE INDEX idx_sessions_token ON player_sessions(token_hash);
CREATE INDEX idx_sessions_expires ON player_sessions(expires_at);

-- Inventory system
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    item_id VARCHAR(64) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    slot INTEGER NOT NULL,
    enhancement_level INTEGER DEFAULT 0,
    durability INTEGER,
    custom_data JSONB DEFAULT '{}'::jsonb,
    acquired_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT positive_quantity CHECK (quantity > 0),
    CONSTRAINT valid_enhancement CHECK (enhancement_level BETWEEN 0 AND 10)
);

CREATE INDEX idx_inventory_player ON inventory(player_id);
CREATE INDEX idx_inventory_item ON inventory(item_id);

-- Equipment slots
CREATE TABLE equipment (
    player_id UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
    main_hand UUID REFERENCES inventory(id),
    off_hand UUID REFERENCES inventory(id),
    head UUID REFERENCES inventory(id),
    body UUID REFERENCES inventory(id),
    hands UUID REFERENCES inventory(id),
    legs UUID REFERENCES inventory(id),
    feet UUID REFERENCES inventory(id),
    accessory_1 UUID REFERENCES inventory(id),
    accessory_2 UUID REFERENCES inventory(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Skills table
CREATE TABLE player_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    skill_id VARCHAR(64) NOT NULL,
    skill_level INTEGER NOT NULL DEFAULT 1,
    experience INTEGER DEFAULT 0,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(player_id, skill_id),
    CONSTRAINT valid_skill_level CHECK (skill_level BETWEEN 1 AND 100)
);

CREATE INDEX idx_player_skills_player ON player_skills(player_id);

-- Guilds
CREATE TABLE guilds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(64) UNIQUE NOT NULL,
    tag VARCHAR(6) UNIQUE NOT NULL,
    leader_id UUID NOT NULL REFERENCES players(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    col_balance BIGINT DEFAULT 0,
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0,
    settings JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_guilds_leader ON guilds(leader_id);

-- Guild members
CREATE TABLE guild_members (
    guild_id UUID REFERENCES guilds(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    rank VARCHAR(32) DEFAULT 'Member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    contribution_points INTEGER DEFAULT 0,
    
    PRIMARY KEY (guild_id, player_id)
);

-- Parties (temporary groups)
CREATE TABLE parties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    leader_id UUID NOT NULL REFERENCES players(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    floor INTEGER NOT NULL DEFAULT 1,
    is_public BOOLEAN DEFAULT FALSE,
    max_members INTEGER DEFAULT 6
);

-- Party members
CREATE TABLE party_members (
    party_id UUID REFERENCES parties(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    PRIMARY KEY (party_id, player_id)
);

-- Floor unlock progress
CREATE TABLE floor_progress (
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    floor INTEGER NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_cleared BOOLEAN DEFAULT FALSE,
    cleared_at TIMESTAMP WITH TIME ZONE,
    
    PRIMARY KEY (player_id, floor)
);

-- Achievement system
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    achievement_id VARCHAR(64) NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    progress JSONB DEFAULT '{}'::jsonb,
    
    UNIQUE(player_id, achievement_id)
);
```

#### 4.1.2 Game World Tables

```sql
-- Floors configuration
CREATE TABLE floors (
    floor_number INTEGER PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    level_range_min INTEGER NOT NULL,
    level_range_max INTEGER NOT NULL,
    is_unlocked BOOLEAN DEFAULT FALSE,
    unlock_requirements JSONB,
    boss_id VARCHAR(64),
    settings JSONB DEFAULT '{}'::jsonb
);

-- Monsters/NPCs
CREATE TABLE monster_templates (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    level INTEGER NOT NULL,
    hp INTEGER NOT NULL,
    mp INTEGER DEFAULT 0,
    stats JSONB NOT NULL,
    ai_type VARCHAR(32) DEFAULT 'aggressive',
    drops JSONB DEFAULT '[]'::jsonb,
    exp_reward INTEGER NOT NULL,
    col_reward INTEGER DEFAULT 0,
    spawn_areas JSONB DEFAULT '[]'::jsonb,
    respawn_time INTEGER DEFAULT 300 -- seconds
);

-- Items
CREATE TABLE item_templates (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    type VARCHAR(32) NOT NULL, -- weapon, armor, consumable, material, etc
    rarity VARCHAR(16) DEFAULT 'common',
    level_requirement INTEGER DEFAULT 1,
    stats JSONB DEFAULT '{}'::jsonb,
    effects JSONB DEFAULT '[]'::jsonb,
    can_trade BOOLEAN DEFAULT TRUE,
    can_enhance BOOLEAN DEFAULT FALSE,
    durability INTEGER,
    max_stack INTEGER DEFAULT 1,
    icon VARCHAR(255),
    model VARCHAR(255)
);

-- Skills
CREATE TABLE skill_templates (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    category VARCHAR(32) NOT NULL, -- combat, support, crafting, passive
    weapon_type VARCHAR(32), -- null for universal
    required_level INTEGER DEFAULT 1,
    required_skills JSONB DEFAULT '[]'::jsonb,
    mp_cost INTEGER DEFAULT 0,
    cooldown INTEGER DEFAULT 0, -- milliseconds
    pre_motion_time INTEGER DEFAULT 500, -- milliseconds
    execution_time INTEGER DEFAULT 1000,
    post_motion_time INTEGER DEFAULT 500,
    damage_formula TEXT,
    effects JSONB DEFAULT '[]'::jsonb,
    animation_id VARCHAR(64),
    icon VARCHAR(255)
);
```

#### 4.1.3 Economy Tables

```sql
-- Player transactions (atomic, for audit)
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id),
    transaction_type VARCHAR(32) NOT NULL, -- earn, spend, trade, etc
    amount INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    description TEXT,
    related_player_id UUID REFERENCES players(id),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_transactions_player ON transactions(player_id);
CREATE INDEX idx_transactions_created ON transactions(created_at);

-- Marketplace listings
CREATE TABLE marketplace_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES players(id),
    inventory_item_id UUID NOT NULL REFERENCES inventory(id),
    price INTEGER NOT NULL,
    listed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    
    CONSTRAINT positive_price CHECK (price > 0)
);

CREATE INDEX idx_marketplace_seller ON marketplace_listings(seller_id);
CREATE INDEX idx_marketplace_price ON marketplace_listings(price);
CREATE INDEX idx_marketplace_item ON marketplace_listings(inventory_item_id);
```

### 4.2 Event Sourcing Tables

```sql
-- Event store for audit trail and replay capability
CREATE TABLE game_events (
    id BIGSERIAL PRIMARY KEY,
    event_id UUID UNIQUE DEFAULT uuid_generate_v4(),
    event_type VARCHAR(64) NOT NULL,
    aggregate_type VARCHAR(32) NOT NULL, -- player, guild, item, etc
    aggregate_id UUID NOT NULL,
    player_id UUID REFERENCES players(id),
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sequence_number BIGINT NOT NULL,
    payload JSONB NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    UNIQUE(aggregate_type, aggregate_id, sequence_number)
);

-- Partition by month for performance
CREATE TABLE game_events_2024_01 PARTITION OF game_events
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
-- Create partitions dynamically or use pg_partman

CREATE INDEX idx_game_events_aggregate ON game_events(aggregate_type, aggregate_id);
CREATE INDEX idx_game_events_type ON game_events(event_type);
CREATE INDEX idx_game_events_player ON game_events(player_id);
CREATE INDEX idx_game_events_time ON game_events(occurred_at);

-- Combat events (high frequency, separate table)
CREATE TABLE combat_events (
    id BIGSERIAL PRIMARY KEY,
    event_id UUID UNIQUE DEFAULT uuid_generate_v4(),
    attacker_id UUID REFERENCES players(id),
    defender_id UUID REFERENCES players(id),
    event_type VARCHAR(32) NOT NULL, -- attack, skill_use, damage, death
    skill_id VARCHAR(64),
    damage INTEGER,
    is_critical BOOLEAN DEFAULT FALSE,
    floor INTEGER,
    position JSONB,
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_combat_events_attacker ON combat_events(attacker_id);
CREATE INDEX idx_combat_events_defender ON combat_events(defender_id);
CREATE INDEX idx_combat_events_time ON combat_events(occurred_at);

-- Movement events (for anti-cheat analysis)
CREATE TABLE movement_events (
    id BIGSERIAL PRIMARY KEY,
    player_id UUID NOT NULL REFERENCES players(id),
    floor INTEGER NOT NULL,
    from_position JSONB NOT NULL,
    to_position JSONB NOT NULL,
    distance DECIMAL(10,2) NOT NULL,
    time_delta INTEGER NOT NULL, -- milliseconds
    calculated_speed DECIMAL(10,2) NOT NULL,
    server_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    client_time TIMESTAMP WITH TIME ZONE,
    is_validated BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_movement_events_player ON movement_events(player_id);
CREATE INDEX idx_movement_events_time ON movement_events(server_time);
```

### 4.3 Redis Schema

```typescript
// Redis key patterns for hot data

// Sessions (TTL: 24 hours)
// Key: session:{token_hash}
// Value: { playerId, username, expiresAt }
// TTL: 86400

// Player online status
// Key: player:online:{playerId}
// Value: { serverId, connectedAt, lastPing }
// TTL: 300 (5 minutes without ping = offline)

// Player position (real-time)
// Key: pos:{playerId}
// Value: { floor, x, y, z, rotation, timestamp }
// TTL: 60

// Spatial index per floor
// Key: spatial:floor:{floorNumber}
// Type: Redis Geospatial
// Value: player positions for quick range queries

// Active entities per floor
// Key: entities:floor:{floorNumber}
// Type: Hash
// Value: { entityId: serializedEntityData }

// Global chat channels
// Key: chat:global
// Type: Redis Stream
// Max length: 1000 messages

// Party chat
// Key: chat:party:{partyId}
// Type: Redis Stream
// Max length: 500 messages

// Guild chat
// Key: chat:guild:{guildId}
// Type: Redis Stream
// Max length: 500 messages

// Combat state
// Key: combat:active:{playerId}
// Value: { targetId, skillId, startTime, phase }
// TTL: 30 (combat state expires quickly)

// Skill cooldowns
// Key: cd:{playerId}:{skillId}
// Value: expiration timestamp
// TTL: dynamic based on skill cooldown

// Rate limiting
// Key: ratelimit:{playerId}:{action}
// Type: Redis List or using Redis Cell module

// Leaderboards
// Key: lb:level
// Type: Redis Sorted Set
// Score: level * 1000000 + exp
// Member: playerId

// Key: lb:col
// Type: Redis Sorted Set
// Score: col amount
// Member: playerId

// Key: lb:achievement_points
// Type: Redis Sorted Set
// Score: points
// Member: playerId

// Active parties
// Key: party:{partyId}
// Value: { leaderId, members: [], createdAt, floor }
// TTL: 3600 (1 hour of inactivity = disband)

// Active guilds (cache)
// Key: guild:{guildId}
// Value: guild data
// TTL: 3600

// Market listings (cache of active)
// Key: market:active
// Type: Redis Sorted Set (by price) or Hash

// Server status
// Key: server:{serverId}:status
// Value: { onlinePlayers, tickRate, memory, cpu }
// TTL: 60

// World state per floor
// Key: world:floor:{floorNumber}
// Value: { bossSpawned, bossHp, activeEvents }
// TTL: 300
```

### 4.4 Database Sharding Strategy

```typescript
// src/database/sharding.ts

// Player data sharding by player_id
// Uses consistent hashing for shard selection

interface ShardConfig {
  id: number
  host: string
  port: number
  database: string
  weight: number
}

const SHARDS: ShardConfig[] = [
  { id: 1, host: "db-shard-1", port: 5432, database: "sao_game", weight: 1 },
  { id: 2, host: "db-shard-2", port: 5432, database: "sao_game", weight: 1 },
  { id: 3, host: "db-shard-3", port: 5432, database: "sao_game", weight: 1 },
  // ... more shards
]

// Consistent hashing for shard selection
function getShardForPlayer(playerId: string): ShardConfig {
  const hash = hashCode(playerId)
  const totalWeight = SHARDS.reduce((sum, s) => sum + s.weight, 0)
  const normalizedHash = Math.abs(hash) % totalWeight
  
  let cumulativeWeight = 0
  for (const shard of SHARDS) {
    cumulativeWeight += shard.weight
    if (normalizedHash < cumulativeWeight) {
      return shard
    }
  }
  
  return SHARDS[0]
}

// Cross-shard queries for guild/party operations
async function executeCrossShardQuery<T>(
  query: (shard: ShardConfig) => Promise<T>
): Promise<T[]> {
  const results = await Promise.all(
    SHARDS.map((shard) => query(shard).catch(() => null))
  )
  return results.filter((r): r is T => r !== null)
}

// Entity distribution (floors are distributed across servers)
// Each floor is assigned to a specific game server
const FLOOR_DISTRIBUTION = {
  1: "server-1",
  2: "server-1",
  // ... floors distributed across servers
}

function getServerForFloor(floor: number): string {
  return FLOOR_DISTRIBUTION[floor] || "server-1"
}
```

---

## 5. API/Network Protocol

### 5.1 Protocol Overview

```
Protocol: WSS (WebSocket Secure)
Encoding: Binary for game state, JSON for control messages
Compression: perMessageDeflate (native Bun support)
Rate Limiting: Token bucket per connection
Authentication: JWT with HMAC-SHA256 signature
```

### 5.2 Message Types

#### 5.2.1 Client → Server Messages

```typescript
// Authentication
interface AuthMessage {
  type: "AUTH"
  nonce: number
  timestamp: number
  payload: {
    token: string // JWT
    clientVersion: string
    protocolVersion: number
  }
}

// Player movement input
interface MoveMessage {
  type: "MOVE"
  nonce: number
  timestamp: number
  payload: {
    position: { x: number; y: number; z: number }
    rotation: number
    velocity: { x: number; y: number }
    sequence: number // Client sequence for reconciliation
  }
}

// Skill activation
interface SkillMessage {
  type: "SKILL"
  nonce: number
  timestamp: number
  payload: {
    skillId: string
    targetId?: string // For targeted skills
    targetPosition?: { x: number; y: number; z: number } // For AoE
    sequence: number
  }
}

// Attack/basic action
interface AttackMessage {
  type: "ATTACK"
  nonce: number
  timestamp: number
  payload: {
    targetId?: string
    direction: number
    sequence: number
  }
}

// Interact with object/NPC
interface InteractMessage {
  type: "INTERACT"
  nonce: number
  timestamp: number
  payload: {
    targetId: string
    interactionType: "talk" | "trade" | "loot" | "use"
  }
}

// Inventory action
interface InventoryMessage {
  type: "INVENTORY"
  nonce: number
  timestamp: number
  payload: {
    action: "use" | "equip" | "unequip" | "drop" | "move"
    itemId: string
    slot?: number
    quantity?: number
  }
}

// Chat message
interface ChatMessage {
  type: "CHAT"
  nonce: number
  timestamp: number
  payload: {
    channel: "global" | "party" | "guild" | "whisper" | "say"
    message: string
    targetPlayerId?: string // For whispers
  }
}

// Party/Guild actions
interface SocialMessage {
  type: "SOCIAL"
  nonce: number
  timestamp: number
  payload: {
    action: "invite" | "accept" | "decline" | "leave" | "kick" | "promote"
    targetPlayerId?: string
    partyId?: string
    guildId?: string
  }
}

// Ping/keepalive
interface PingMessage {
  type: "PING"
  nonce: number
  timestamp: number
  payload: {
    clientTime: number
  }
}
```

#### 5.2.2 Server → Client Messages

```typescript
// Authentication response
interface AuthResponse {
  type: "AUTH_RESPONSE"
  timestamp: number
  payload: {
    success: boolean
    playerId: string
    playerData: PlayerData
    error?: string
  }
}

// State snapshot (full sync)
interface StateSnapshot {
  type: "STATE_SNAPSHOT"
  timestamp: number
  payload: {
    tick: number
    player: PlayerState
    entities: EntityState[]
    floor: number
    serverTime: number
  }
}

// Delta update (incremental)
interface DeltaUpdate {
  type: "DELTA_UPDATE"
  timestamp: number
  payload: {
    tick: number
    changes: Array<{
      type: "entity" | "player" | "combat" | "item"
      id: string
      data: unknown
      removed?: boolean
    }>
  }
}

// Position correction (server authority)
interface PositionCorrection {
  type: "POSITION_CORRECTION"
  timestamp: number
  payload: {
    sequence: number // Client sequence being corrected
    position: { x: number; y: number; z: number }
    reason: "speed_limit" | "invalid_position" | "server_reconciliation"
  }
}

// Skill execution confirmation
interface SkillConfirm {
  type: "SKILL_CONFIRM"
  timestamp: number
  payload: {
    sequence: number
    skillId: string
    status: "started" | "executing" | "completed" | "cancelled"
    phase: "pre" | "execution" | "post"
    cooldownEnd: number
  }
}

// Combat event
interface CombatEvent {
  type: "COMBAT_EVENT"
  timestamp: number
  payload: {
    eventType: "damage" | "heal" | "miss" | "crit" | "death" | "skill_hit"
    sourceId: string
    targetId: string
    amount?: number
    skillId?: string
    isCritical?: boolean
    position: { x: number; y: number; z: number }
  }
}

// Inventory update
interface InventoryUpdate {
  type: "INVENTORY_UPDATE"
  timestamp: number
  payload: {
    changes: Array<{
      itemId: string
      slot: number
      quantity: number
      removed?: boolean
    }>
  }
}

// Chat message
interface ChatBroadcast {
  type: "CHAT"
  timestamp: number
  payload: {
    channel: string
    senderId: string
    senderName: string
    message: string
  }
}

// System message
interface SystemMessage {
  type: "SYSTEM"
  timestamp: number
  payload: {
    messageType: "info" | "warning" | "error" | "achievement" | "loot"
    title: string
    message: string
    data?: Record<string, unknown>
  }
}

// Error response
interface ErrorMessage {
  type: "ERROR"
  timestamp: number
  payload: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}

// Pong response
interface PongMessage {
  type: "PONG"
  timestamp: number
  payload: {
    clientTime: number
    serverTime: number
    latency: number
  }
}
```

### 5.3 Binary Protocol for Game State

```typescript
// src/protocol/binary.ts

// Use binary encoding for high-frequency state updates
// Format: [MessageType:1][PayloadLength:4][Payload:N]

enum BinaryMessageType {
  ENTITY_POSITION = 0x01,
  ENTITY_STATE = 0x02,
  COMBAT_UPDATE = 0x03,
  SKILL_EXECUTION = 0x04,
  INVENTORY_CHANGE = 0x05,
}

// Entity position update (16 bytes)
// Most frequent message - optimized for size
function encodePositionUpdate(
  entityId: number, // 4 bytes - use numeric IDs for entities
  x: number, // 4 bytes (fixed-point)
  y: number, // 4 bytes
  z: number, // 4 bytes
  rotation: number // 2 bytes (0-360, 1 degree precision)
): Buffer {
  const buf = Buffer.alloc(19)
  buf.writeUInt8(BinaryMessageType.ENTITY_POSITION, 0)
  buf.writeUInt32LE(entityId, 1)
  buf.writeInt32LE(floatToFixed(x), 5)
  buf.writeInt32LE(floatToFixed(y), 9)
  buf.writeInt32LE(floatToFixed(z), 13)
  buf.writeUInt16LE(Math.floor(rotation * 10), 17)
  return buf
}

// Convert float to fixed-point (2 decimal places)
function floatToFixed(n: number): number {
  return Math.round(n * 100)
}

function fixedToFloat(n: number): number {
  return n / 100
}

// Entity state update (variable size)
function encodeEntityState(entity: EntityState): Buffer {
  const jsonData = JSON.stringify({
    id: entity.id,
    hp: entity.hp,
    maxHp: entity.maxHp,
    mp: entity.mp,
    maxMp: entity.maxMp,
    level: entity.level,
    statusEffects: entity.statusEffects,
  })
  
  const jsonBuffer = Buffer.from(jsonData, "utf-8")
  const buf = Buffer.alloc(5 + jsonBuffer.length)
  buf.writeUInt8(BinaryMessageType.ENTITY_STATE, 0)
  buf.writeUInt32LE(jsonBuffer.length, 1)
  jsonBuffer.copy(buf, 5)
  return buf
}

// Combat update
function encodeCombatUpdate(
  sourceId: number,
  targetId: number,
  damage: number,
  damageType: number,
  isCrit: boolean
): Buffer {
  const buf = Buffer.alloc(15)
  buf.writeUInt8(BinaryMessageType.COMBAT_UPDATE, 0)
  buf.writeUInt32LE(sourceId, 1)
  buf.writeUInt32LE(targetId, 5)
  buf.writeInt32LE(damage, 9)
  buf.writeUInt8(damageType, 13)
  buf.writeUInt8(isCrit ? 1 : 0, 14)
  return buf
}
```

### 5.4 Effect-TS Protocol Handler

```typescript
// src/protocol/handler.ts
import { Effect, Context, Data, Schema } from "effect"
import { type ServerWebSocket } from "bun"

// Define schemas for validation
const PositionSchema = Schema.Struct({
  x: Schema.Number,
  y: Schema.Number,
  z: Schema.Number,
})

const MovePayloadSchema = Schema.Struct({
  position: PositionSchema,
  rotation: Schema.Number,
  velocity: Schema.Struct({
    x: Schema.Number,
    y: Schema.Number,
  }),
  sequence: Schema.Number,
})

const MoveMessageSchema = Schema.Struct({
  type: Schema.Literal("MOVE"),
  nonce: Schema.Number,
  timestamp: Schema.Number,
  payload: MovePayloadSchema,
})

// Protocol errors
class ProtocolError extends Data.TaggedError("ProtocolError")<{
  code: string
  message: string
  fatal: boolean
}> {}

// Message router
export const routeMessage = (
  ws: ServerWebSocket<WSData>,
  message: unknown
): Effect.Effect<void, ProtocolError, MessageHandlers> =>
  Effect.gen(function* () {
    const handlers = yield* MessageHandlers
    
    // Validate base message structure
    const baseMessage = yield* Schema.decodeUnknown(BaseMessageSchema)(message).pipe(
      Effect.mapError(() =>
        new ProtocolError({
          code: "INVALID_FORMAT",
          message: "Message does not match expected format",
          fatal: false,
        })
      )
    )
    
    // Route to specific handler
    switch (baseMessage.type) {
      case "AUTH":
        yield* handlers.handleAuth(ws, message)
        break
      case "MOVE":
        yield* handlers.handleMove(ws, message)
        break
      case "SKILL":
        yield* handlers.handleSkill(ws, message)
        break
      case "ATTACK":
        yield* handlers.handleAttack(ws, message)
        break
      case "CHAT":
        yield* handlers.handleChat(ws, message)
        break
      case "PING":
        yield* handlers.handlePing(ws, message)
        break
      default:
        yield* Effect.fail(
          new ProtocolError({
            code: "UNKNOWN_TYPE",
            message: `Unknown message type: ${baseMessage.type}`,
            fatal: false,
          })
        )
    }
  })

// Handler implementations
export class MessageHandlers extends Context.Tag("MessageHandlers")<
  MessageHandlers,
  {
    handleAuth: (
      ws: ServerWebSocket<WSData>,
      msg: unknown
    ) => Effect.Effect<void, ProtocolError, never>
    handleMove: (
      ws: ServerWebSocket<WSData>,
      msg: unknown
    ) => Effect.Effect<void, ProtocolError, never>
    handleSkill: (
      ws: ServerWebSocket<WSData>,
      msg: unknown
    ) => Effect.Effect<void, ProtocolError, never>
    handleAttack: (
      ws: ServerWebSocket<WSData>,
      msg: unknown
    ) => Effect.Effect<void, ProtocolError, never>
    handleChat: (
      ws: ServerWebSocket<WSData>,
      msg: unknown
    ) => Effect.Effect<void, ProtocolError, never>
    handlePing: (
      ws: ServerWebSocket<WSData>,
      msg: unknown
    ) => Effect.Effect<void, ProtocolError, never>
  }
>() {}

// Move handler with validation
const handleMove = (
  ws: ServerWebSocket<WSData>,
  msg: unknown
): Effect.Effect<void, ProtocolError, GameService> =>
  Effect.gen(function* () {
    const game = yield* GameService
    
    // Validate authenticated
    if (!ws.data.authenticated || !ws.data.playerId) {
      yield* Effect.fail(
        new ProtocolError({
          code: "NOT_AUTHENTICATED",
          message: "Must authenticate before moving",
          fatal: true,
        })
      )
      return
    }
    
    // Decode and validate message
    const moveMsg = yield* Schema.decodeUnknown(MoveMessageSchema)(msg).pipe(
      Effect.mapError(() =>
        new ProtocolError({
          code: "INVALID_MOVE",
          message: "Invalid move message format",
          fatal: false,
        })
      )
    )
    
    // Validate timestamp (prevent replay attacks)
    const now = Date.now()
    const msgAge = now - moveMsg.timestamp
    if (msgAge > 1000 || msgAge < -500) {
      yield* Effect.fail(
        new ProtocolError({
          code: "INVALID_TIMESTAMP",
          message: "Message timestamp out of acceptable range",
          fatal: false,
        })
      )
      return
    }
    
    // Submit to game service for processing
    yield* game.submitPlayerInput(ws.data.playerId, {
      type: "MOVE",
      timestamp: moveMsg.timestamp,
      sequence: moveMsg.payload.sequence,
      data: moveMsg.payload,
    })
  })
```

---

## 6. Security Architecture

### 6.1 Server-Authoritative Design

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐             │
│  │   Input    │  │ Prediction │  │  Render    │             │
│  │ Collection │  │ & Display  │  │  Engine    │             │
│  └─────┬──────┘  └────────────┘  └────────────┘             │
└────────┼─────────────────────────────────────────────────────┘
         │ INPUT ONLY (position request, skill use)
         │ No damage calculation, no position authority
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    SERVER (Bun + Effect-TS)                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐             │
│  │  Validate  │  │  Authori-  │  │   Sync     │             │
│  │   Input    │──│   tative   │──│  State     │             │
│  │            │  │  Logic     │  │            │             │
│  └────────────┘  └────────────┘  └────────────┘             │
│         │               │                                     │
│         ▼               ▼                                     │
│  ┌────────────┐  ┌────────────┐                              │
│  │  Reject    │  │  Calculate │                              │
│  │  Invalid   │  │  Results   │                              │
│  └────────────┘  └────────────┘                              │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Anti-Cheat Measures

#### 6.2.1 Speed Hack Detection

```typescript
// src/security/anti-cheat.ts
import { Effect, Ref } from "effect"
import { Data } from "effect"

// Player movement validation
interface MovementValidation {
  playerId: string
  fromPosition: Vector3
  toPosition: Vector3
  timeDelta: number // milliseconds
  claimedSpeed: number
}

class SpeedHackDetected extends Data.TaggedError("SpeedHackDetected")<{
  playerId: string
  calculatedSpeed: number
  maxAllowedSpeed: number
  severity: "minor" | "moderate" | "severe"
}> {}

// Validate player movement
export const validateMovement = (
  validation: MovementValidation
): Effect.Effect<
  boolean,
  SpeedHackDetected,
  PlayerStatsService
> =>
  Effect.gen(function* () {
    const statsService = yield* PlayerStatsService
    
    // Calculate actual distance
    const distance = calculateDistance(
      validation.fromPosition,
      validation.toPosition
    )
    
    // Calculate actual speed (units per second)
    const actualSpeed = (distance / validation.timeDelta) * 1000
    
    // Get player max speed from server-authoritative stats
    const playerStats = yield* statsService.getStats(validation.playerId)
    const baseSpeed = playerStats.movementSpeed
    const maxSpeedBonus = 1.5 // Maximum possible speed buff
    const maxAllowedSpeed = baseSpeed * maxSpeedBonus
    
    // Add tolerance for network jitter (10%)
    const tolerance = 1.1
    const maxAllowedWithTolerance = maxAllowedSpeed * tolerance
    
    // Check for speed violation
    if (actualSpeed > maxAllowedWithTolerance) {
      const severity = calculateSeverity(
        actualSpeed,
        maxAllowedSpeed
      )
      
      yield* Effect.fail(
        new SpeedHackDetected({
          playerId: validation.playerId,
          calculatedSpeed: actualSpeed,
          maxAllowedSpeed: maxAllowedSpeed,
          severity,
        })
      )
    }
    
    return true
  })

// Position validation - prevent teleportation
export const validatePosition = (
  playerId: string,
  claimedPosition: Vector3,
  lastServerPosition: Vector3
): Effect.Effect<boolean, PositionValidationError, WorldService> =>
  Effect.gen(function* () {
    const worldService = yield* WorldService
    
    // Check if position is valid in world
    const isValidPosition = yield* worldService.isValidPosition(
      claimedPosition
    )
    
    if (!isValidPosition) {
      yield* Effect.fail(
        new PositionValidationError({
          playerId,
          reason: "INVALID_LOCATION",
          claimedPosition,
        })
      )
    }
    
    // Check distance from last known position
    const distance = calculateDistance(lastServerPosition, claimedPosition)
    const maxTeleportDistance = 10 // Maximum allowed instant movement
    
    if (distance > maxTeleportDistance) {
      // Check if player used valid teleport (town portal, etc)
      const hasValidTeleport = yield* checkValidTeleport(playerId)
      
      if (!hasValidTeleport) {
        yield* Effect.fail(
          new PositionValidationError({
            playerId,
            reason: "SUSPECTED_TELEPORT",
            claimedPosition,
            distance,
          })
        )
      }
    }
    
    return true
  })

// Behavioral analysis for pattern detection
export const analyzeBehavior = (
  playerId: string
): Effect.Effect<void, never, AnalyticsService> =>
  Effect.gen(function* () {
    const analytics = yield* AnalyticsService
    
    // Check movement patterns
    const movementPattern = yield* analytics.getMovementPattern(playerId)
    
    // Detect inhuman consistency
    if (movementPattern.consistencyScore > 0.95) {
      // Human players have natural variation
      yield* Effect.logWarning(
        `Suspicious consistency detected: player ${playerId}`
      )
      yield* flagForReview(playerId, "CONSISTENT_MOVEMENT")
    }
    
    // Check reaction times
    const avgReactionTime = yield* analytics.getAverageReactionTime(playerId)
    if (avgReactionTime < 80) {
      // Too fast for human reaction
      yield* Effect.logWarning(
        `Inhuman reaction time detected: ${avgReactionTime}ms`
      )
      yield* flagForReview(playerId, "FAST_REACTION")
    }
  })
```

#### 6.2.2 Combat Validation

```typescript
// src/security/combat-validation.ts

// Server-authoritative combat system
interface CombatValidation {
  attackerId: string
  defenderId: string
  skillId?: string
  claimedDamage: number
  timestamp: number
}

export const validateCombat = (
  combat: CombatValidation
): Effect.Effect<
  ValidatedCombat,
  CombatValidationError,
  CombatService
> =>
  Effect.gen(function* () {
    const combatService = yield* CombatService
    
    // 1. Verify both entities exist and are alive
    const [attacker, defender] = yield* Effect.all([
      combatService.getEntity(combat.attackerId),
      combatService.getEntity(combat.defenderId),
    ])
    
    if (!attacker || !defender) {
      yield* Effect.fail(
        new CombatValidationError("ENTITY_NOT_FOUND")
      )
    }
    
    if (attacker.hp <= 0 || defender.hp <= 0) {
      yield* Effect.fail(
        new CombatValidationError("ENTITY_DEAD")
      )
    }
    
    // 2. Verify distance (melee vs ranged)
    const distance = calculateDistance(attacker.position, defender.position)
    const attackRange = combat.skillId
      ? yield* getSkillRange(combat.skillId)
      : attacker.attackRange
    
    if (distance > attackRange * 1.2) { // 20% tolerance for lag
      yield* Effect.fail(
        new CombatValidationError("OUT_OF_RANGE", { distance, attackRange })
      )
    }
    
    // 3. Verify skill cooldown and availability
    if (combat.skillId) {
      const canUseSkill = yield* combatService.canUseSkill(
        combat.attackerId,
        combat.skillId
      )
      
      if (!canUseSkill) {
        yield* Effect.fail(
          new CombatValidationError("SKILL_ON_COOLDOWN")
        )
      }
      
      // Verify attacker has the skill unlocked
      const hasSkill = yield* combatService.hasSkill(
        combat.attackerId,
        combat.skillId
      )
      
      if (!hasSkill) {
        yield* Effect.fail(
          new CombatValidationError("SKILL_NOT_UNLOCKED")
        )
      }
    }
    
    // 4. Calculate server-authoritative damage
    const serverDamage = yield* calculateDamage(
      attacker,
      defender,
      combat.skillId
    )
    
    // 5. Verify claimed damage matches (within tolerance)
    const damageTolerance = 0.05 // 5% tolerance for rounding
    const damageDiff = Math.abs(serverDamage - combat.claimedDamage)
    
    if (damageDiff > serverDamage * damageTolerance) {
      yield* Effect.fail(
        new CombatValidationError("DAMAGE_MISMATCH", {
          claimed: combat.claimedDamage,
          calculated: serverDamage,
        })
      )
    }
    
    return {
      ...combat,
      validatedDamage: serverDamage,
    }
  })

// Critical hit validation (prevent client-side manipulation)
export const validateCriticalHit = (
  attacker: Entity,
  isCritical: boolean
): Effect.Effect<boolean, never, never> =>
  Effect.gen(function* () {
    // Calculate critical chance server-side
    const critChance = calculateCritChance(attacker)
    const roll = Math.random()
    const serverIsCritical = roll < critChance
    
    // Client claimed crit but server says no = reject
    if (isCritical && !serverIsCritical) {
      return false
    }
    
    return serverIsCritical
  })
```

#### 6.2.3 Economy Protection

```typescript
// src/security/economy.ts

// Prevent item duplication
interface ItemTransaction {
  transactionId: string
  playerId: string
  itemId: string
  quantity: number
  fromInventory: boolean
  toInventory: boolean
  timestamp: number
}

export const processItemTransaction = (
  transaction: ItemTransaction
): Effect.Effect<
  void,
  EconomyError,
  InventoryService | TransactionLogService
> =>
  Effect.gen(function* () {
    const inventory = yield* InventoryService
    const transactionLog = yield* TransactionLogService
    
    // 1. Check for duplicate transaction ID (replay protection)
    const isDuplicate = yield* transactionLog.exists(
      transaction.transactionId
    )
    
    if (isDuplicate) {
      yield* Effect.fail(
        new EconomyError("DUPLICATE_TRANSACTION")
      )
    }
    
    // 2. Log transaction atomically before processing
    yield* transactionLog.log(transaction)
    
    // 3. Verify item exists in source
    if (transaction.fromInventory) {
      const hasItem = yield* inventory.hasItem(
        transaction.playerId,
        transaction.itemId,
        transaction.quantity
      )
      
      if (!hasItem) {
        yield* Effect.fail(
          new EconomyError("INSUFFICIENT_ITEMS")
        )
      }
    }
    
    // 4. Process transaction atomically
    yield* Effect.acquireUseRelease(
      // Acquire lock
      inventory.acquireLock(transaction.playerId),
      // Use
      (lock) =>
        Effect.gen(function* () {
          if (transaction.fromInventory) {
            yield* inventory.removeItem(
              transaction.playerId,
              transaction.itemId,
              transaction.quantity
            )
          }
          
          if (transaction.toInventory) {
            yield* inventory.addItem(
              transaction.playerId,
              transaction.itemId,
              transaction.quantity
            )
          }
          
          // Mark as completed
          yield* transactionLog.markCompleted(
            transaction.transactionId
          )
        }),
      // Release
      (lock) => inventory.releaseLock(transaction.playerId)
    )
  })

// Col transaction validation
export const processColTransaction = (
  fromPlayerId: string,
  toPlayerId: string | null, // null for NPC/shop transactions
  amount: number
): Effect.Effect<void, EconomyError, EconomyService> =>
  Effect.gen(function* () {
    const economy = yield* EconomyService
    
    // 1. Verify amount is positive
    if (amount <= 0) {
      yield* Effect.fail(new EconomyError("INVALID_AMOUNT"))
    }
    
    // 2. Check sender has sufficient balance
    const senderBalance = yield* economy.getBalance(fromPlayerId)
    
    if (senderBalance < amount) {
      yield* Effect.fail(new EconomyError("INSUFFICIENT_FUNDS"))
    }
    
    // 3. Verify transaction doesn't overflow receiver
    if (toPlayerId) {
      const receiverBalance = yield* economy.getBalance(toPlayerId)
      const MAX_COL = 9_999_999_999 // Max Col limit
      
      if (receiverBalance + amount > MAX_COL) {
        yield* Effect.fail(new EconomyError("RECEIVER_OVERFLOW"))
      }
    }
    
    // 4. Atomic transfer
    yield* economy.transferAtomic(fromPlayerId, toPlayerId, amount)
    
    // 5. Log for audit
    yield* economy.logTransaction({
      fromPlayerId,
      toPlayerId,
      amount,
      timestamp: Date.now(),
    })
  })
```

### 6.3 Authentication & Session Security

```typescript
// src/security/auth.ts
import { Effect } from "effect"
import * as jwt from "jsonwebtoken"
import { createHash, randomBytes } from "crypto"

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET!
const JWT_EXPIRY = "15m" // Short-lived access tokens
const REFRESH_TOKEN_EXPIRY = "7d"

interface TokenPayload {
  playerId: string
  username: string
  iat: number
  exp: number
  nonce: string
}

// Generate secure tokens
export const generateTokens = (
  playerId: string,
  username: string
): Effect.Effect<
  { accessToken: string; refreshToken: string },
  never,
  never
> =>
  Effect.sync(() => {
    const nonce = randomBytes(16).toString("hex")
    
    const accessToken = jwt.sign(
      { playerId, username, nonce },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    )
    
    const refreshToken = jwt.sign(
      { playerId, type: "refresh", nonce },
      JWT_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    )
    
    return { accessToken, refreshToken }
  })

// Validate token with security checks
export const validateToken = (
  token: string,
  clientIp: string,
  userAgent: string
): Effect.Effect<
  TokenPayload,
  AuthenticationError,
  SessionService
> =>
  Effect.gen(function* () {
    const sessionService = yield* SessionService
    
    // 1. Verify JWT signature and expiry
    let payload: TokenPayload
    try {
      payload = jwt.verify(token, JWT_SECRET) as TokenPayload
    } catch (error) {
      yield* Effect.fail(
        new AuthenticationError("INVALID_TOKEN")
      )
    }
    
    // 2. Check if token is blacklisted
    const isBlacklisted = yield* sessionService.isBlacklisted(token)
    
    if (isBlacklisted) {
      yield* Effect.fail(
        new AuthenticationError("TOKEN_REVOKED")
      )
    }
    
    // 3. Verify session exists and matches
    const session = yield* sessionService.getSession(payload.playerId)
    
    if (!session || session.tokenHash !== hashToken(token)) {
      yield* Effect.fail(
        new AuthenticationError("SESSION_INVALID")
      )
    }
    
    // 4. Validate origin (prevent token theft usage)
    if (session.ipAddress !== clientIp) {
      // IP changed - require re-authentication
      yield* Effect.fail(
        new AuthenticationError("IP_MISMATCH")
      )
    }
    
    // 5. Check for concurrent session abuse
    const activeSessions = yield* sessionService.getActiveSessions(
      payload.playerId
    )
    
    if (activeSessions.length > 3) {
      // Too many concurrent sessions
      yield* Effect.fail(
        new AuthenticationError("TOO_MANY_SESSIONS")
      )
    }
    
    return payload
  })

// WebSocket origin validation (prevent CSWSH)
export const validateWebSocketOrigin = (
  request: Request
): Effect.Effect<boolean, never, never> =>
  Effect.sync(() => {
    const allowedOrigins = [
      "https://sword-art-online.com",
      "https://www.sword-art-online.com",
    ]
    
    const origin = request.headers.get("origin")
    
    if (!origin) {
      return false // Reject if no origin (browser should always send)
    }
    
    return allowedOrigins.includes(origin)
  })

// Hash token for storage (don't store raw tokens)
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}
```

### 6.4 Rate Limiting

```typescript
// src/security/rate-limit.ts
import { Effect } from "effect"

// Rate limiting configuration
const RATE_LIMITS = {
  MOVE: { bucketSize: 30, refillRate: 20 }, // 20 moves/sec normal
  ATTACK: { bucketSize: 10, refillRate: 5 }, // 5 attacks/sec
  SKILL: { bucketSize: 5, refillRate: 2 }, // 2 skills/sec
  CHAT: { bucketSize: 10, refillRate: 2 }, // 2 messages/sec
  TRADE: { bucketSize: 5, refillRate: 1 }, // 1 trade/sec
}

interface RateLimitEntry {
  bucket: number
  lastRefill: number
}

export const checkRateLimit = (
  playerId: string,
  actionType: keyof typeof RATE_LIMITS
): Effect.Effect<
  boolean,
  RateLimitExceeded,
  RedisService
> =>
  Effect.gen(function* () {
    const redis = yield* RedisService
    const config = RATE_LIMITS[actionType]
    
    const key = `ratelimit:${playerId}:${actionType}`
    const now = Date.now()
    
    // Get current bucket state
    const entry = yield* redis.get<RateLimitEntry>(key)
    
    let bucket: number
    let lastRefill: number
    
    if (entry) {
      // Calculate refills since last check
      const timePassed = now - entry.lastRefill
      const refills = Math.floor(
        (timePassed / 1000) * config.refillRate
      )
      
      bucket = Math.min(
        config.bucketSize,
        entry.bucket + refills
      )
      lastRefill = now
    } else {
      // New bucket
      bucket = config.bucketSize
      lastRefill = now
    }
    
    // Check if request can be processed
    if (bucket < 1) {
      const retryAfter = Math.ceil(1000 / config.refillRate)
      yield* Effect.fail(
        new RateLimitExceeded(actionType, retryAfter)
      )
    }
    
    // Consume token
    bucket--
    
    // Update Redis with TTL
    yield* redis.set(key, { bucket, lastRefill }, {
      ttl: 60, // 1 minute TTL
    })
    
    return true
  })

// Global rate limiting (per IP)
export const checkGlobalRateLimit = (
  ipAddress: string
): Effect.Effect<boolean, never, RedisService> =>
  Effect.gen(function* () {
    const redis = yield* RedisService
    const key = `global_ratelimit:${ipAddress}`
    
    const count = yield* redis.increment(key)
    
    if (count === 1) {
      // First request, set window
      yield* redis.expire(key, 60) // 1 minute window
    }
    
    if (count > 100) {
      // More than 100 requests per minute
      yield* Effect.logWarning(`Global rate limit exceeded: ${ipAddress}`)
      return false
    }
    
    return true
  })
```

---

## 7. Deployment Infrastructure

### 7.1 Docker Configuration

#### 7.1.1 Game Server Dockerfile

```dockerfile
# Dockerfile.game
FROM oven/bun:1.0-alpine AS base

WORKDIR /app

# Copy dependencies
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile --production

# Copy source
COPY . .

# Build
RUN bun run build

# Production image
FROM oven/bun:1.0-alpine AS production

WORKDIR /app

# Copy built files
COPY --from=base /app/dist ./dist
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./

# Security: Run as non-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun run healthcheck || exit 1

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["bun", "run", "dist/index.js"]
```

#### 7.1.2 Docker Compose

```yaml
# docker-compose.yml
version: "3.8"

services:
  # Game servers (scale horizontally)
  game-server:
    build:
      context: .
      dockerfile: Dockerfile.game
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: "2"
          memory: 4G
        reservations:
          cpus: "1"
          memory: 2G
    environment:
      - NODE_ENV=production
      - PORT=3000
      - REDIS_URL=redis://redis:6379
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/sao_game
      - JWT_SECRET=${JWT_SECRET}
      - TICK_RATE=20
    depends_on:
      - redis
      - postgres
    networks:
      - game-network
    ports:
      - "3000-3002:3000"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Load balancer
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - game-server
    networks:
      - game-network

  # Redis cluster
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --maxmemory 2gb --maxmemory-policy allkeys-lru
    volumes:
      - redis-data:/data
    networks:
      - game-network
    deploy:
      resources:
        limits:
          memory: 2G

  # PostgreSQL primary
  postgres:
    image: postgres:18-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=sao_game
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./migrations:/docker-entrypoint-initdb.d
    networks:
      - game-network
    deploy:
      resources:
        limits:
          memory: 4G

  # TimescaleDB for analytics
  timescaledb:
    image: timescale/timescaledb:latest-pg15
    environment:
      - POSTGRES_USER=analytics
      - POSTGRES_PASSWORD=${ANALYTICS_DB_PASSWORD}
      - POSTGRES_DB=sao_analytics
    volumes:
      - timescale-data:/var/lib/postgresql/data
    networks:
      - game-network

  # Monitoring - Prometheus
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus-data:/prometheus
    networks:
      - game-network
    ports:
      - "9090:9090"

  # Monitoring - Grafana
  grafana:
    image: grafana/grafana:latest
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards:ro
      - ./grafana/datasources:/etc/grafana/provisioning/datasources:ro
    networks:
      - game-network
    ports:
      - "3001:3000"

networks:
  game-network:
    driver: bridge

volumes:
  redis-data:
  postgres-data:
  timescale-data:
  prometheus-data:
  grafana-data:
```

### 7.2 Kubernetes Deployment

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: sao-game

---
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: game-config
  namespace: sao-game
data:
  PORT: "3000"
  TICK_RATE: "20"
  MAX_CONNECTIONS: "10000"
  REDIS_URL: "redis://redis-cluster:6379"

---
# k8s/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: game-secrets
  namespace: sao-game
type: Opaque
stringData:
  DATABASE_URL: "postgresql://postgres:password@postgres:5432/sao_game"
  JWT_SECRET: "your-secret-key"
  REDIS_PASSWORD: "redis-password"

---
# k8s/game-server-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: game-server
  namespace: sao-game
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: game-server
  template:
    metadata:
      labels:
        app: game-server
    spec:
      containers:
        - name: game-server
          image: sao-game/server:latest
          ports:
            - containerPort: 3000
              name: websocket
          resources:
            requests:
              memory: "2Gi"
              cpu: "1000m"
            limits:
              memory: "4Gi"
              cpu: "2000m"
          envFrom:
            - configMapRef:
                name: game-config
            - secretRef:
                name: game-secrets
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 30
          readinessProbe:
            httpGet:
              path: /ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10

---
# k8s/game-server-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: game-server
  namespace: sao-game
spec:
  selector:
    app: game-server
  ports:
    - port: 3000
      targetPort: 3000
      name: websocket
  type: ClusterIP

---
# k8s/game-server-hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: game-server-hpa
  namespace: sao-game
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: game-server
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
        - type: Percent
          value: 100
          periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60

---
# k8s/redis-deployment.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: redis
  namespace: sao-game
spec:
  serviceName: redis-cluster
  replicas: 3
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
        - name: redis
          image: redis:7-alpine
          command:
            - redis-server
            - --appendonly
            - "yes"
            - --maxmemory
            - 2gb
            - --maxmemory-policy
            - allkeys-lru
          ports:
            - containerPort: 6379
          resources:
            requests:
              memory: "2Gi"
            limits:
              memory: "2Gi"
          volumeMounts:
            - name: redis-data
              mountPath: /data
  volumeClaimTemplates:
    - metadata:
        name: redis-data
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 10Gi

---
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: game-ingress
  namespace: sao-game
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
    - hosts:
        - game.sword-art-online.com
      secretName: game-tls
  rules:
    - host: game.sword-art-online.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: game-server
                port:
                  number: 3000
```

### 7.3 Scaling Strategy

```
Scaling Architecture:

┌─────────────────────────────────────────────────────────────┐
│                     GLOBAL LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   CDN        │  │   DNS        │  │   Auth       │       │
│  │ (Cloudflare) │  │ (Route53)    │  │   Service    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────▼───────────────────────────────┐
│                  REGIONAL LAYERS                           │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  US-EAST (Primary)                                  │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │  │
│  │  │ Server 1 │  │ Server 2 │  │ Server N │          │  │
│  │  │ Floors   │  │ Floors   │  │ Floors   │          │  │
│  │  │ 1-25     │  │ 26-50    │  │ 51-75    │          │  │
│  │  └──────────┘  └──────────┘  └──────────┘          │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  EU-WEST                                           │  │
│  │  ┌──────────┐  ┌──────────┐                        │  │
│  │  │ Server 1 │  │ Server 2 │                        │  │
│  │  │ Floors   │  │ Floors   │                        │  │
│  │  │ 1-50     │  │ 51-100   │                        │  │
│  │  └──────────┘  └──────────┘                        │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  ASIA-PACIFIC                                       │  │
│  │  ┌──────────┐  ┌──────────┐                        │  │
│  │  │ Server 1 │  │ Server 2 │                        │  │
│  │  │ Floors   │  │ Floors   │                        │  │
│  │  │ 1-50     │  │ 51-100   │                        │  │
│  │  └──────────┘  └──────────┘                        │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

#### Scaling Policies

```yaml
# Horizontal Pod Autoscaler configuration
scalingPolicies:
  # Scale up quickly when load increases
  scaleUp:
    stabilizationWindow: 60s
    policies:
      - type: Percent
        value: 100
        periodSeconds: 60
      - type: Pods
        value: 4
        periodSeconds: 60
    
  # Scale down slowly to prevent thrashing
  scaleDown:
    stabilizationWindow: 300s
    policies:
      - type: Percent
        value: 10
        periodSeconds: 60

# Metrics for scaling
metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  
  # Custom metric: active connections
  - type: Pods
    pods:
      metric:
        name: websocket_connections
      target:
        type: AverageValue
        averageValue: "8000"

# Database scaling
readReplicas: 3
connectionPooling:
  maxConnections: 100
  poolSize: 20

# Redis cluster configuration
redisCluster:
  masterNodes: 3
  replicaNodes: 3
  maxMemory: 2gb
  evictionPolicy: allkeys-lru
```

---

## 8. Development Roadmap

### 8.1 Phase 1: Foundation (Months 1-3)

**Objective**: Core infrastructure and basic gameplay

**Deliverables**:
- [ ] Project setup (Bun + Effect-TS + CI/CD)
- [ ] Database schema implementation
- [ ] Basic WebSocket server with Bun
- [ ] Authentication system
- [ ] Character creation and persistence
- [ ] Basic movement system
- [ ] Floor 1 implementation (Starter Town)
- [ ] Monster spawning and basic AI
- [ ] Basic inventory system

**Team Allocation**:
- 2 Backend Engineers (Effect-TS experts)
- 1 DevOps Engineer
- 1 Database Engineer
- 1 Frontend Developer (Phaser3)

**Milestone**: Players can log in, create character, walk around Floor 1

### 8.2 Phase 2: Combat & Skills (Months 4-6)

**Objective**: Implement core SAO combat mechanics

**Deliverables**:
- [ ] Sword Skills system with pre/post-motion
- [ ] Server-authoritative combat
- [ ] Hit detection and damage calculation
- [ ] Equipment system
- [ ] Enhancement system
- [ ] Skill trees (One-Handed Sword, Rapier, Dagger)
- [ ] Monster combat AI
- [ ] Death and respawn mechanics
- [ ] Floors 2-10 content

**Team Allocation**:
- 3 Backend Engineers
- 1 DevOps Engineer
- 2 Frontend Developers
- 1 Game Designer

**Milestone**: Fully functional combat with 3 weapon types, 10 floors

### 8.3 Phase 3: Social & Economy (Months 7-9)

**Objective**: Multiplayer features and player economy

**Deliverables**:
- [ ] Party system (up to 6 players)
- [ ] Guild system (up to 48 members)
- [ ] Chat system (global, party, guild, whisper)
- [ ] Friend list
- [ ] Trading system
- [ ] Marketplace
- [ ] Crafting system
- [ ] Col economy balance
- [ ] Floors 11-25 content

**Team Allocation**:
- 3 Backend Engineers
- 2 Frontend Developers
- 1 Game Designer
- 1 QA Engineer

**Milestone**: Full social features, player-driven economy, 25 floors

### 8.4 Phase 4: Bosses & Endgame (Months 10-12)

**Objective**: Boss battles and high-level content

**Deliverables**:
- [ ] Boss system with multiple HP bars
- [ ] Floor boss mechanics
- [ ] Raid coordination (48 players)
- [ ] Boss loot tables
- [ ] All 100 floors
- [ ] Secret bosses and hidden content
- [ ] Achievement system
- [ ] Leaderboards
- [ ] Anti-cheat system fully operational

**Team Allocation**:
- 3 Backend Engineers
- 2 Frontend Developers
- 1 Game Designer
- 2 QA Engineers
- 1 Security Engineer

**Milestone**: Complete game loop, all floors, boss raids

### 8.5 Phase 5: Polish & Launch (Months 13-15)

**Objective**: Performance optimization and launch preparation

**Deliverables**:
- [ ] Performance optimization (10k concurrent players)
- [ ] Load testing and stress testing
- [ ] Security audit
- [ ] Bug fixes and polish
- [ ] Tutorial and onboarding
- [ ] Analytics and monitoring
- [ ] Customer support tools
- [ ] Marketing website
- [ ] Beta testing (1000 players)

**Team Allocation**:
- 2 Backend Engineers
- 2 Frontend Developers
- 1 Game Designer
- 3 QA Engineers
- 1 DevOps Engineer
- 1 Security Engineer

**Milestone**: Public launch

### 8.6 Post-Launch (Ongoing)

**Objective**: Live operations and content updates

**Deliverables**:
- [ ] Weekly bug fixes
- [ ] Monthly content updates
- [ ] Seasonal events
- [ ] New floors (expansion)
- [ ] Balance adjustments
- [ ] Community features
- [ ] Esports features

### 8.7 Technology Stack by Phase

```
Phase 1 (Foundation):
├── Bun 1.0+ (WebSocket server)
├── Effect-TS 3.0+ (business logic)
├── PostgreSQL 18 (primary database)
├── Redis 7 (caching/sessions)
├── Docker (containerization)
└── Phaser 3 (client engine)

Phase 2-3 (Core Features):
├── All Phase 1 tech
├── TimescaleDB (analytics)
├── Kubernetes (orchestration)
├── Prometheus + Grafana (monitoring)
└── JWT + bcrypt (security)

Phase 4-5 (Scale & Polish):
├── All previous tech
├── Redis Cluster (high availability)
├── PostgreSQL read replicas
├── CDN (Cloudflare)
├── Automated CI/CD pipeline
└── Advanced anti-cheat systems
```

---

## 9. Appendix

### 9.1 Glossary

| Term | Definition |
|------|------------|
| Aincrad | The floating castle in SAO with 100 floors |
| Col | In-game currency (copper, silver, gold) |
| Floor Boss | Major boss at end of each floor |
| Sword Skill | System-assisted combat technique |
| Pre-Motion | Wind-up animation before skill execution |
| Post-Motion | Recovery animation after skill (vulnerability) |
| Effect-TS | Functional programming library for TypeScript |
| Bun | Fast JavaScript runtime with native WebSocket |
| Server-Authoritative | Server has final say on all game state |

### 9.2 References

- [Sword Art Online Wiki](https://swordartonline.fandom.com/)
- [Effect-TS Documentation](https://effect.website/)
- [Bun Documentation](https://bun.sh/docs)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [Game Programming Patterns](https://gameprogrammingpatterns.com/)

### 9.3 File Structure

```
/docs
├── GAME_PLAN.md (this document)
├── PRD.md (Product Requirements - extract sections 2)
├── ARCHITECTURE.md (System Architecture - extract sections 3)
├── DATABASE.md (Database Design - extract sections 4)
├── PROTOCOL.md (API/Network Protocol - extract sections 5)
├── SECURITY.md (Security Architecture - extract sections 6)
├── DEPLOYMENT.md (Deployment Infrastructure - extract sections 7)
└── ROADMAP.md (Development Roadmap - extract sections 8)
```

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-13  
**Status**: Complete Development Plan
