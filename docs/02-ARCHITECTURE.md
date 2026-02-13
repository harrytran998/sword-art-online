# Sword Art Online: Aincrad Online
## Architecture Design Document

**Version:** 2.0.0
**Date:** February 2026
**Status:** Planning Phase

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Technology Stack](#2-technology-stack)
3. [Modular Project Structure](#3-modular-project-structure)
4. [Module Architecture Rules](#4-module-architecture-rules)
5. [Clean Architecture Layers](#5-clean-architecture-layers)
6. [EventBus Architecture](#6-eventbus-architecture)
7. [Gateway Pattern](#7-gateway-pattern)
8. [WebSocket Protocol](#8-websocket-protocol)
9. [Game Loop Architecture](#9-game-loop-architecture)
10. [State Management](#10-state-management)
11. [Zone/Room Architecture](#11-zoneroom-architecture)
12. [Client Architecture](#12-client-architecture)
13. [Caching Strategy](#13-caching-strategy)
14. [Logging & Observability](#14-logging--observability)
15. [Layer Composition](#15-layer-composition)

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
| **Modular Bounded Contexts** | Each feature is a self-contained module with strict boundaries |
| **Event-Driven Communication** | Modules communicate ONLY through the EventBus, never via direct imports |
| **Clean Architecture** | Domain → Ports → Application → Adapters (dependencies point inward) |
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
| **Database** | PostgreSQL | 18+ | Primary data store (native UUIDv7, full-text search) |
| **Query Builder** | Kysely | 0.27+ | Type-safe SQL query builder (not an ORM) |
| **Migrations** | go-migrate | 4.x | Database migration management |
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

## 3. Modular Project Structure

The server is organized as **vertical feature modules** (bounded contexts). Each module is self-contained with its own domain, ports, application logic, and adapters. Modules never import from each other — they communicate exclusively through the EventBus.

```
src/
├── modules/                          # Feature modules (bounded contexts)
│   ├── identity/                     # Auth, accounts, sessions
│   │   ├── domain/                   # Entities, value objects, domain errors
│   │   │   ├── entities/             # Account, Session
│   │   │   ├── value-objects/        # Email, Password, SessionToken
│   │   │   ├── errors.ts            # IdentityNotFoundError, InvalidCredentials
│   │   │   └── index.ts
│   │   ├── ports/                    # Interfaces (inbound + outbound)
│   │   │   ├── inbound/             # Use case interfaces
│   │   │   │   └── auth.port.ts     # login, register, validateToken
│   │   │   ├── outbound/            # Repository + external service interfaces
│   │   │   │   ├── account.repository.ts
│   │   │   │   └── session.store.ts
│   │   │   └── index.ts
│   │   ├── application/              # Use cases (orchestration logic)
│   │   │   ├── login.use-case.ts
│   │   │   ├── register.use-case.ts
│   │   │   └── index.ts
│   │   ├── adapters/                 # Implementations of ports
│   │   │   ├── inbound/             # WebSocket/HTTP handlers
│   │   │   │   └── auth.handler.ts
│   │   │   ├── outbound/            # DB/cache implementations
│   │   │   │   ├── pg-account.repository.ts
│   │   │   │   └── redis-session.store.ts
│   │   │   └── index.ts
│   │   ├── events/                   # Domain events this module publishes/subscribes
│   │   │   ├── published.ts         # PlayerLoggedIn, PlayerRegistered
│   │   │   ├── subscriptions.ts     # What events from other modules we react to
│   │   │   └── index.ts
│   │   ├── module.ts                 # Effect Layer composition for this module
│   │   └── index.ts                  # Public API (only exports ports + events)
│   │
│   ├── player/                       # Character, stats, progression
│   │   ├── domain/
│   │   │   ├── entities/             # Character, PlayerStats
│   │   │   ├── value-objects/        # PlayerId, CharacterName, Level, ExperiencePoints
│   │   │   ├── errors.ts            # PlayerNotFoundError, InvalidStatsError
│   │   │   └── index.ts
│   │   ├── ports/
│   │   ├── application/              # CreateCharacter, GetPlayer, AllocateStats, LevelUp
│   │   ├── adapters/
│   │   ├── events/                   # PlayerCreated, PlayerLeveledUp, StatsAllocated
│   │   ├── module.ts
│   │   └── index.ts
│   │
│   ├── combat/                       # Sword Skills, damage calc, hit detection
│   │   ├── domain/
│   │   │   ├── entities/             # SwordSkill, CombatSession
│   │   │   ├── value-objects/        # DamageValue, CriticalHit, SkillPhase
│   │   │   ├── errors.ts            # SkillOnCooldownError, OutOfRangeError
│   │   │   └── index.ts
│   │   ├── ports/
│   │   ├── application/              # ActivateSkill, ProcessCombatTick, CalculateDamage
│   │   ├── adapters/
│   │   ├── events/                   # SkillExecuted, DamageDealt, PlayerDefeated
│   │   ├── module.ts
│   │   └── index.ts
│   │
│   ├── monster/                      # Spawning, AI, loot tables
│   │   ├── domain/
│   │   │   ├── entities/             # Monster, SpawnPoint, LootTable
│   │   │   ├── value-objects/        # AggroRange, RespawnTimer
│   │   │   └── index.ts
│   │   ├── ports/
│   │   ├── application/              # SpawnMonster, UpdateMonsterAI, DropLoot
│   │   ├── adapters/
│   │   ├── events/                   # MonsterSpawned, MonsterKilled, LootDropped
│   │   ├── module.ts
│   │   └── index.ts
│   │
│   ├── inventory/                    # Items, equipment, enhancement
│   │   ├── domain/
│   │   │   ├── entities/             # InventorySlot, Equipment, ItemDefinition
│   │   │   ├── value-objects/        # ItemId, EquipmentSlot, EnhancementLevel
│   │   │   └── index.ts
│   │   ├── ports/
│   │   ├── application/              # AddItem, EquipItem, UseItem, EnhanceItem
│   │   ├── adapters/
│   │   ├── events/                   # ItemPickedUp, ItemEquipped, ItemEnhanced
│   │   ├── module.ts
│   │   └── index.ts
│   │
│   ├── economy/                      # Col, trading, auction house
│   │   ├── domain/
│   │   │   ├── entities/             # Trade, AuctionListing, NpcShop
│   │   │   ├── value-objects/        # Col, TradeId, AuctionBid
│   │   │   └── index.ts
│   │   ├── ports/
│   │   ├── application/              # InitiateTrade, ExecuteTrade, CreateAuction, PlaceBid
│   │   ├── adapters/
│   │   ├── events/                   # TradeCompleted, AuctionSold, ColTransferred
│   │   ├── module.ts
│   │   └── index.ts
│   │
│   ├── social/                       # Party, guild, friends, chat
│   │   ├── domain/
│   │   │   ├── entities/             # Party, Guild, Friendship, ChatMessage
│   │   │   ├── value-objects/        # PartyId, GuildId, GuildRank, ChatChannel
│   │   │   └── index.ts
│   │   ├── ports/
│   │   ├── application/              # CreateParty, InviteToGuild, SendChat, AddFriend
│   │   ├── adapters/
│   │   ├── events/                   # PartyCreated, GuildCreated, ChatSent, FriendAdded
│   │   ├── module.ts
│   │   └── index.ts
│   │
│   ├── world/                        # Floors, zones, navigation, teleportation
│   │   ├── domain/
│   │   │   ├── entities/             # Floor, Zone, SpawnPoint
│   │   │   ├── value-objects/        # FloorId, ZoneId, Position, ZoneBounds
│   │   │   └── index.ts
│   │   ├── ports/
│   │   ├── application/              # ChangeZone, ValidateMovement, Teleport
│   │   ├── adapters/
│   │   ├── events/                   # PlayerEnteredZone, PlayerLeftZone, FloorUnlocked
│   │   ├── module.ts
│   │   └── index.ts
│   │
│   ├── quest/                        # Quest system, NPC interactions
│   │   ├── domain/
│   │   │   ├── entities/             # Quest, QuestObjective, NpcDialogue
│   │   │   ├── value-objects/        # QuestId, ObjectiveProgress, QuestStatus
│   │   │   └── index.ts
│   │   ├── ports/
│   │   ├── application/              # AcceptQuest, UpdateProgress, CompleteQuest
│   │   ├── adapters/
│   │   ├── events/                   # QuestAccepted, QuestCompleted, ObjectiveUpdated
│   │   ├── module.ts
│   │   └── index.ts
│   │
│   └── analytics/                    # Event logging, metrics, leaderboards
│       ├── domain/
│       │   ├── entities/             # GameEvent, LeaderboardEntry
│       │   ├── value-objects/        # MetricName, TimeRange
│       │   └── index.ts
│       ├── ports/
│       ├── application/              # LogEvent, UpdateLeaderboard, QueryMetrics
│       ├── adapters/
│       ├── events/                   # (subscribes to events from ALL modules)
│       ├── module.ts
│       └── index.ts
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
│   │   ├── message-router.ts       # Routes client messages → correct module handler
│   │   └── binary-protocol.ts      # Position update binary encoding
│   ├── game-loop/                   # 60Hz tick-based simulation
│   │   ├── game-loop.ts
│   │   └── tick-pipeline.ts        # Per-tick processing pipeline
│   └── http/                        # REST endpoints (health, auth via Better Auth)
│       └── routes.ts
│
└── index.ts                          # Main entry - compose all module Layers
```

### 3.1 Module Summary

| Module | Bounded Context | Key Entities | Key Events |
|--------|----------------|--------------|------------|
| **identity** | Auth, accounts, sessions | Account, Session | PlayerLoggedIn, PlayerRegistered |
| **player** | Character, stats, progression | Character, PlayerStats | PlayerCreated, PlayerLeveledUp |
| **combat** | Sword Skills, damage, hit detection | SwordSkill, CombatSession | SkillExecuted, DamageDealt |
| **monster** | Spawning, AI, loot tables | Monster, SpawnPoint, LootTable | MonsterKilled, LootDropped |
| **inventory** | Items, equipment, enhancement | InventorySlot, Equipment | ItemPickedUp, ItemEquipped |
| **economy** | Col, trading, auction house | Trade, AuctionListing | TradeCompleted, ColTransferred |
| **social** | Party, guild, friends, chat | Party, Guild, Friendship | PartyCreated, ChatSent |
| **world** | Floors, zones, navigation | Floor, Zone | PlayerEnteredZone, FloorUnlocked |
| **quest** | Quest system, NPC interactions | Quest, QuestObjective | QuestCompleted, ObjectiveUpdated |
| **analytics** | Event logging, metrics | GameEvent, LeaderboardEntry | *(subscribes only)* |

---

## 4. Module Architecture Rules

These are **strict architectural constraints** enforced across the entire codebase.

### Rule 1: No Direct Module Imports

Modules **NEVER** import from other modules directly. The only shared code comes from `shared/kernel/`, which contains only types and interfaces.

```typescript
// ✅ ALLOWED - import shared kernel types
import { PlayerId, ZoneId } from "@/shared/kernel/types"
import { DomainEvent } from "@/shared/kernel/events"

// ❌ FORBIDDEN - never import another module
import { PlayerService } from "@/modules/player"
import { CombatSession } from "@/modules/combat/domain"
```

### Rule 2: EventBus-Only Communication

All inter-module communication goes through the **EventBus**. If module A needs to react to something that happens in module B, module B publishes a domain event and module A subscribes to it.

```typescript
// modules/combat/events/published.ts
// Combat publishes when a monster is killed
export class MonsterKilled extends Data.TaggedClass("MonsterKilled")<{
  readonly monsterId: string
  readonly killerId: PlayerId
  readonly position: Position
  readonly timestamp: number
}> {}

// modules/inventory/events/subscriptions.ts
// Inventory subscribes to generate loot drops
eventBus.subscribe("MonsterKilled", (event) =>
  Effect.gen(function* () {
    const loot = yield* generateLoot(event.monsterId)
    yield* addItemsToPlayer(event.killerId, loot)
  })
)

// modules/analytics/events/subscriptions.ts
// Analytics also subscribes to log the kill
eventBus.subscribe("MonsterKilled", (event) =>
  logGameEvent("monster_kill", event)
)
```

### Rule 3: Minimal Public API

Each module's `index.ts` ONLY exports:
1. Its **Effect Layer** (for composition in `index.ts`)
2. Its **published event types** (for other modules to subscribe to)
3. Its **port interfaces** (for type checking at boundaries)

```typescript
// modules/combat/index.ts
export { CombatModule } from "./module"                    // Effect Layer
export type { CombatPort } from "./ports/inbound/combat.port"  // Port interface
export * from "./events/published"                         // Event types
// Nothing else is exported
```

### Rule 4: Pure Domain Layer

The domain layer has **ZERO external dependencies** — no Effect, no database, no Redis. It contains only pure TypeScript: entities, value objects, and domain errors.

```typescript
// modules/combat/domain/value-objects/damage-value.ts
// Pure TypeScript - no imports from Effect, Kysely, Redis, etc.
export class DamageValue {
  readonly value: number

  private constructor(value: number) {
    this.value = value
  }

  static create(base: number, multiplier: number, defense: number): DamageValue {
    const reduced = base * multiplier * (1 - defense / (defense + 100))
    return new DamageValue(Math.max(1, Math.floor(reduced)))
  }

  isLethal(currentHp: number): boolean {
    return this.value >= currentHp
  }
}
```

### Rule 5: Kernel Contains Only Types

The `shared/kernel/` contains **ONLY types and interfaces**, never implementations. It exists to provide shared vocabulary (branded types, base event interface) without creating coupling.

```typescript
// shared/kernel/types.ts - ONLY branded types
import { Brand } from "effect"

export type PlayerId = string & Brand.Brand<"PlayerId">
export const PlayerId = Brand.nominal<PlayerId>()

export type ZoneId = string & Brand.Brand<"ZoneId">
export const ZoneId = Brand.nominal<ZoneId>()

export type FloorId = number & Brand.Brand<"FloorId">
export const FloorId = Brand.nominal<FloorId>()

export type ItemId = string & Brand.Brand<"ItemId">
export const ItemId = Brand.nominal<ItemId>()

// shared/kernel/events.ts - ONLY base event interface
export interface DomainEvent {
  readonly _tag: string
  readonly timestamp: number
  readonly aggregateId: string
}

// shared/kernel/errors.ts - ONLY base error types
export class DomainError extends Data.TaggedError("DomainError")<{
  readonly message: string
}> {}
```

### Architectural Constraint Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                    MODULE BOUNDARY RULES                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Module A                       Module B                        │
│  ┌──────────────────┐          ┌──────────────────┐             │
│  │  domain/         │          │  domain/         │             │
│  │  ports/          │          │  ports/          │             │
│  │  application/    │          │  application/    │             │
│  │  adapters/       │          │  adapters/       │             │
│  │  events/         │          │  events/         │             │
│  └────────┬─────────┘          └────────┬─────────┘             │
│           │                             │                        │
│           │    ╔════════════════╗        │                        │
│           └───▶║   EventBus    ║◀───────┘                        │
│                ║  (shared/)    ║                                  │
│                ╚══════╤═══════╝                                  │
│                       │                                          │
│              ┌────────▼────────┐                                 │
│              │  shared/kernel/ │  (types only)                   │
│              │  types.ts       │                                  │
│              │  events.ts      │                                  │
│              │  errors.ts      │                                  │
│              └─────────────────┘                                 │
│                                                                  │
│  ❌ Module A ──imports──▶ Module B  (NEVER)                      │
│  ✅ Module A ──publishes──▶ EventBus ──delivers──▶ Module B      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Clean Architecture Layers

Each module follows Clean Architecture internally. Dependencies ALWAYS point inward — outer layers depend on inner layers, never the reverse.

```
┌─────────────────────────────────────────────────────┐
│                     ADAPTERS                         │
│  (WebSocket handlers, DB repos, Redis stores)        │
│  ┌─────────────────────────────────────────────┐    │
│  │                APPLICATION                    │    │
│  │  (Use cases, orchestration)                   │    │
│  │  ┌─────────────────────────────────────┐     │    │
│  │  │              PORTS                   │     │    │
│  │  │  (Interfaces for in/out)             │     │    │
│  │  │  ┌─────────────────────────────┐    │     │    │
│  │  │  │          DOMAIN              │    │     │    │
│  │  │  │  (Entities, value objects)   │    │     │    │
│  │  │  └─────────────────────────────┘    │     │    │
│  │  └─────────────────────────────────────┘     │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘

Dependency direction: Adapters → Application → Ports → Domain
```

### 5.1 Domain Layer

Pure TypeScript entities, value objects, and domain errors. No external dependencies whatsoever.

```typescript
// modules/player/domain/entities/character.ts
import type { PlayerId } from "@/shared/kernel/types"

interface CharacterProps {
  readonly id: PlayerId
  readonly name: string
  readonly classId: number
  readonly level: number
  readonly experience: number
  readonly stats: CharacterStats
}

export class Character {
  private constructor(private readonly props: CharacterProps) {}

  static create(props: CharacterProps): Character {
    return new Character(props)
  }

  get id(): PlayerId { return this.props.id }
  get level(): number { return this.props.level }

  canLevelUp(): boolean {
    return this.props.experience >= this.experienceNeeded()
  }

  experienceNeeded(): number {
    return 100 * this.props.level ** 2
  }

  maxHp(): number {
    return 100 + (this.props.level - 1) * 20 + this.props.stats.vit * 10
  }

  maxMp(): number {
    return 50 + (this.props.level - 1) * 5 + this.props.stats.int * 5
  }
}
```

### 5.2 Ports Layer

Interfaces defining what the module can do (inbound) and what it needs (outbound). Defined using Effect `Context.Tag`.

```typescript
// modules/player/ports/inbound/player.port.ts
import { Context, Effect } from "effect"
import type { PlayerId } from "@/shared/kernel/types"

export class PlayerPort extends Context.Tag("PlayerPort")<
  PlayerPort,
  {
    readonly createCharacter: (params: CreateCharacterParams) =>
      Effect.Effect<Character, CharacterNameTakenError>
    readonly getPlayer: (id: PlayerId) =>
      Effect.Effect<Character, PlayerNotFoundError>
    readonly allocateStats: (id: PlayerId, stats: StatAllocation) =>
      Effect.Effect<void, PlayerNotFoundError | InsufficientStatPointsError>
  }
>() {}

// modules/player/ports/outbound/character.repository.ts
export class CharacterRepository extends Context.Tag("CharacterRepository")<
  CharacterRepository,
  {
    readonly findById: (id: PlayerId) => Effect.Effect<Character | null>
    readonly findByName: (name: string) => Effect.Effect<Character | null>
    readonly save: (character: Character) => Effect.Effect<void>
    readonly update: (character: Character) => Effect.Effect<void>
  }
>() {}
```

### 5.3 Application Layer

Use case implementations that orchestrate domain logic and depend on ports. Use `Effect.gen`.

```typescript
// modules/player/application/create-character.use-case.ts
import { Effect } from "effect"
import { CharacterRepository } from "../ports/outbound/character.repository"
import { EventBus } from "@/shared/infrastructure/event-bus"
import { Character } from "../domain/entities/character"
import { PlayerCreated } from "../events/published"

export const createCharacter = (params: CreateCharacterParams) =>
  Effect.gen(function* () {
    const repo = yield* CharacterRepository
    const eventBus = yield* EventBus

    // 1. Check name uniqueness (domain rule)
    const existing = yield* repo.findByName(params.name)
    if (existing) {
      return yield* Effect.fail(new CharacterNameTakenError({ name: params.name }))
    }

    // 2. Create domain entity
    const character = Character.create({
      id: params.playerId,
      name: params.name,
      classId: params.classId,
      level: 1,
      experience: 0,
      stats: getStartingStats(params.classId),
    })

    // 3. Persist via outbound port
    yield* repo.save(character)

    // 4. Publish domain event
    yield* eventBus.publish(new PlayerCreated({
      playerId: character.id,
      name: character.name,
      classId: character.classId,
      timestamp: Date.now(),
    }))

    return character
  })
```

### 5.4 Adapters Layer

Concrete implementations of ports. Database queries, Redis calls, WebSocket handlers.

```typescript
// modules/player/adapters/outbound/pg-character.repository.ts
import { Effect, Layer } from "effect"
import { CharacterRepository } from "../../ports/outbound/character.repository"
import { DatabaseService } from "@/shared/infrastructure/database"

export const PgCharacterRepositoryLive = Layer.effect(
  CharacterRepository,
  Effect.gen(function* () {
    const db = yield* DatabaseService  // provides Kysely instance

    return {
      findById: (id) =>
        Effect.tryPromise(() =>
          db.kysely
            .selectFrom("characters")
            .selectAll()
            .where("id", "=", id)
            .executeTakeFirst()
        ).pipe(Effect.map((row) => row ? Character.create(row) : null)),

      findByName: (name) =>
        Effect.tryPromise(() =>
          db.kysely
            .selectFrom("characters")
            .selectAll()
            .where("name", "=", name)
            .executeTakeFirst()
        ).pipe(Effect.map((row) => row ? Character.create(row) : null)),

      save: (character) =>
        Effect.tryPromise(() =>
          db.kysely
            .insertInto("characters")
            .values({
              id: character.id,  // UUIDv7 via PostgreSQL 18 uuidv7()
              name: character.name,
              class_id: character.classId,
              level: character.level,
              experience: 0,
            })
            .execute()
        ),

      update: (character) =>
        Effect.tryPromise(() =>
          db.kysely
            .updateTable("characters")
            .set({ level: character.level, experience: character.experience })
            .where("id", "=", character.id)
            .execute()
        ),
    }
  })
)

// modules/player/adapters/inbound/player.handler.ts
import { Effect, Layer } from "effect"
import { PlayerPort } from "../../ports/inbound/player.port"
import { createCharacter } from "../../application/create-character.use-case"
import { getPlayer } from "../../application/get-player.use-case"

export const PlayerHandlerLive = Layer.effect(
  PlayerPort,
  Effect.gen(function* () {
    return {
      createCharacter,
      getPlayer,
      allocateStats,
    }
  })
)
```

### 5.5 Module Composition

Each module's `module.ts` composes its layers into a single Effect Layer.

```typescript
// modules/player/module.ts
import { Layer } from "effect"
import { PlayerHandlerLive } from "./adapters/inbound/player.handler"
import { PgCharacterRepositoryLive } from "./adapters/outbound/pg-character.repository"
import { RedisPlayerCacheLive } from "./adapters/outbound/redis-player-cache"
import { playerEventSubscriptions } from "./events/subscriptions"

export const PlayerModule = Layer.mergeAll(
  PlayerHandlerLive,
  PgCharacterRepositoryLive,
  RedisPlayerCacheLive,
  playerEventSubscriptions
)
```

---

## 6. EventBus Architecture

The EventBus is the **backbone** for all inter-module communication. No module ever calls another module's code directly.

### 6.1 EventBus Service Definition

```typescript
// shared/infrastructure/event-bus/event-bus.ts
import { Context, Effect, Data } from "effect"
import type { DomainEvent } from "@/shared/kernel/events"

export class EventBus extends Context.Tag("EventBus")<
  EventBus,
  {
    readonly publish: <E extends DomainEvent>(event: E) => Effect.Effect<void>
    readonly subscribe: <E extends DomainEvent>(
      eventType: E["_tag"],
      handler: (event: E) => Effect.Effect<void>
    ) => Effect.Effect<void>
  }
>() {}
```

### 6.2 In-Memory Implementation (Phase 0-1)

```typescript
// shared/infrastructure/event-bus/in-memory-event-bus.ts
import { Effect, Layer, Queue, Schedule } from "effect"
import { EventBus } from "./event-bus"

export const InMemoryEventBusLive = Layer.effect(
  EventBus,
  Effect.gen(function* () {
    const subscribers = new Map<string, Set<(event: any) => Effect.Effect<void>>>()
    const eventQueue = yield* Queue.unbounded<DomainEvent>()

    // Process events asynchronously
    const processEvents = Effect.gen(function* () {
      const event = yield* Queue.take(eventQueue)
      const handlers = subscribers.get(event._tag) || new Set()

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
      subscribe: (eventType, handler) =>
        Effect.sync(() => {
          if (!subscribers.has(eventType)) {
            subscribers.set(eventType, new Set())
          }
          subscribers.get(eventType)!.add(handler as any)
        }),
    }
  })
)
```

### 6.3 Event Flow Example

A complete flow showing how a monster kill ripples across modules via events:

```
Player kills monster
        │
        ▼
┌──────────────┐   publishes    ┌─────────────────────┐
│ combat module │──────────────▶│ MonsterKilled event  │
└──────────────┘                └──────────┬──────────┘
                                           │
                          ┌────────────────┼────────────────┐
                          │                │                │
                          ▼                ▼                ▼
               ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
               │   monster    │  │  inventory   │  │  analytics   │
               │   module     │  │   module     │  │   module     │
               │              │  │              │  │              │
               │ • respawn    │  │ • drop loot  │  │ • log kill   │
               │   timer      │  │ • add items  │  │ • update     │
               │ • update     │  │   to player  │  │   leaderboard│
               │   spawn pool │  │              │  │              │
               └──────┬───────┘  └──────┬───────┘  └──────────────┘
                      │                 │
                      ▼                 ▼
           ┌─────────────────┐  ┌──────────────────┐
           │ MonsterSpawned  │  │ ItemPickedUp     │
           │ (new event)     │  │ (new event)      │
           └─────────────────┘  └──────────────────┘
```

### 6.4 Scalability Path

The EventBus implementation is swappable without changing any module code:

| Phase | Implementation | Characteristics |
|-------|---------------|-----------------|
| **Phase 0-1** | In-memory `Queue` | Single server, simple, zero latency |
| **Phase 2** | Redis Streams | Multi-server, at-least-once delivery |
| **Phase 3+** | NATS / Kafka | Unlimited scale, event sourcing ready |

Since all modules depend on the `EventBus` interface (not the implementation), swapping is a single `Layer` change in `index.ts`:

```typescript
// Phase 0-1
const EventBusLayer = InMemoryEventBusLive

// Phase 2 - just swap the layer
const EventBusLayer = RedisStreamsEventBusLive

// Phase 3+ - swap again
const EventBusLayer = NatsEventBusLive
```

---

## 7. Gateway Pattern

The **Gateway** is the entry point to the server. It handles external connections (WebSocket, HTTP) and the game loop, routing messages to the appropriate module handlers.

### 7.1 WebSocket Server

```typescript
// gateway/websocket/server.ts
import { Context, Effect, Layer, Queue } from "effect"

interface WebSocketData {
  readonly playerId: PlayerId
  readonly sessionToken: string
  readonly connectedAt: number
  readonly zoneId: ZoneId
}

export class WebSocketGateway extends Context.Tag("WebSocketGateway")<
  WebSocketGateway,
  {
    readonly broadcastToZone: (zoneId: ZoneId, type: string, data: unknown) =>
      Effect.Effect<void>
    readonly sendToPlayer: (playerId: PlayerId, message: unknown) =>
      Effect.Effect<void>
    readonly broadcast: (type: string, data: unknown) => Effect.Effect<void>
  }
>() {}

export const WebSocketGatewayLive = Layer.effect(
  WebSocketGateway,
  Effect.gen(function* () {
    const messageRouter = yield* MessageRouter
    const identityModule = yield* IdentityPort
    const connections = new Map<string, ServerWebSocket<WebSocketData>>()

    const websocketHandlers = {
      open(ws: ServerWebSocket<WebSocketData>) {
        connections.set(ws.data.playerId, ws)
        ws.subscribe(`zone:${ws.data.zoneId}`)
        ws.subscribe(`player:${ws.data.playerId}`)
      },

      message(ws: ServerWebSocket<WebSocketData>, message: string | Buffer) {
        Effect.runPromise(
          messageRouter.route(ws.data.playerId, message)
        )
      },

      close(ws: ServerWebSocket<WebSocketData>) {
        connections.delete(ws.data.playerId)
        ws.unsubscribe(`zone:${ws.data.zoneId}`)
        ws.unsubscribe(`player:${ws.data.playerId}`)
      },
    }

    return {
      broadcastToZone: (zoneId, type, data) =>
        Effect.sync(() => server.publish(`zone:${zoneId}`, JSON.stringify({ type, data }))),
      sendToPlayer: (playerId, message) =>
        Effect.sync(() => connections.get(playerId)?.send(JSON.stringify(message))),
      broadcast: (type, data) =>
        Effect.sync(() => server.publish("global", JSON.stringify({ type, data }))),
    }
  })
)
```

### 7.2 Message Router

The message router dispatches incoming client messages to the correct module handler. This is the ONLY place where the gateway references module ports.

```typescript
// gateway/websocket/message-router.ts
import { Effect, Match } from "effect"
import type { PlayerId } from "@/shared/kernel/types"
import type { ClientMessage } from "@/shared/kernel/messages"

export const routeMessage = (msg: ClientMessage, playerId: PlayerId) =>
  Match.type<ClientMessage>().pipe(
    // World module handles movement
    Match.tag("movement", (m) => worldModule.handleMovement(playerId, m)),

    // Combat module handles skill activation/cancellation
    Match.tag("skill_activate", (m) => combatModule.handleSkillActivate(playerId, m)),
    Match.tag("skill_cancel", (m) => combatModule.handleSkillCancel(playerId, m)),

    // Social module handles chat
    Match.tag("chat", (m) => socialModule.handleChat(playerId, m)),

    // Economy module handles trading
    Match.tag("trade_request", (m) => economyModule.handleTradeRequest(playerId, m)),
    Match.tag("trade_accept", (m) => economyModule.handleTradeAccept(playerId, m)),

    // Inventory module handles item operations
    Match.tag("item_use", (m) => inventoryModule.handleItemUse(playerId, m)),
    Match.tag("item_equip", (m) => inventoryModule.handleItemEquip(playerId, m)),

    // Heartbeat handled directly by gateway
    Match.tag("heartbeat", (m) => handleHeartbeat(playerId, m)),

    Match.exhaustive
  )(msg)
```

### 7.3 Binary Protocol for Position Updates

High-frequency position updates use a binary protocol to minimize bandwidth:

```typescript
// gateway/websocket/binary-protocol.ts

// Position update: 43 bytes vs ~200 bytes JSON
// Format: [type:1][playerId:16][x:4][y:4][z:4][floorId:2][zoneId:8][tick:4]
const encodePositionUpdate = (update: PositionUpdate): ArrayBuffer => {
  const buffer = new ArrayBuffer(43)
  const view = new DataView(buffer)

  view.setUint8(0, MessageType.POSITION_UPDATE)
  // ... encode fields as binary
  return buffer
}

const decodePositionUpdate = (buffer: ArrayBuffer): PositionUpdate => {
  const view = new DataView(buffer)
  // ... decode binary fields
}
```

---

## 8. WebSocket Protocol

### 8.1 Client → Server Messages

```typescript
// shared/kernel/messages.ts

type ClientMessage =
  | { _tag: "movement"; direction: Direction; timestamp: number }
  | { _tag: "skill_activate"; skillId: string; targetId?: string; timestamp: number }
  | { _tag: "skill_cancel"; skillId: string }
  | { _tag: "chat"; channel: ChatChannel; message: string }
  | { _tag: "trade_request"; targetPlayerId: string }
  | { _tag: "trade_accept"; tradeId: string }
  | { _tag: "item_use"; itemId: string; targetId?: string }
  | { _tag: "item_equip"; itemId: string; slot: EquipmentSlot }
  | { _tag: "heartbeat"; timestamp: number }
```

### 8.2 Server → Client Messages

```typescript
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

Client messages use `_tag` for Effect `Match.tag()` routing in the gateway message router. Server messages use `type` for client-side dispatch.

---

## 9. Game Loop Architecture

The game loop runs in the **gateway** layer at a fixed 60Hz tick rate. Each tick, it calls into module handlers for their respective domains.

### 9.1 Tick-Based Simulation

```typescript
// gateway/game-loop/game-loop.ts
import { Context, Effect, Layer, Schedule, Ref } from "effect"

interface GameState {
  readonly tick: number
  readonly entities: Map<string, Entity>
  readonly pendingInputs: Map<string, PlayerInput[]>
}

export class GameLoopService extends Context.Tag("GameLoopService")<
  GameLoopService,
  {
    readonly start: Effect.Effect<void>
    readonly stop: Effect.Effect<void>
    readonly getTick: Effect.Effect<number>
  }
>() {}

const TICK_RATE = 60 // 60 Hz
const TICK_INTERVAL = 1000 / TICK_RATE // ~16.67ms

export const GameLoopLive = Layer.effect(
  GameLoopService,
  Effect.gen(function* () {
    const stateRef = yield* Ref.make<GameState>({
      tick: 0,
      entities: new Map(),
      pendingInputs: new Map(),
    })

    let running = false
    let tickFiber: Fiber.Fiber<void, never>

    const gameTick = Effect.gen(function* () {
      const state = yield* Ref.get(stateRef)
      const newTick = state.tick + 1

      // 1. Process all pending inputs
      yield* processInputs(state.pendingInputs)

      // 2. Update movement (→ world module)
      yield* worldModule.updateMovement(state.entities)

      // 3. Process combat (→ combat module)
      yield* combatModule.processCombatTick(state.entities)

      // 4. Update monster AI (→ monster module)
      yield* monsterModule.updateAI()

      // 5. Handle collisions
      yield* handleCollisions(state.entities)

      // 6. Validate state (anti-cheat)
      yield* validateGameState(state.entities)

      // 7. Broadcast delta updates to clients
      yield* broadcastUpdates(state.entities, newTick)

      // 8. Update tick counter
      yield* Ref.update(stateRef, (s) => ({ ...s, tick: newTick }))
    })

    const start = Effect.gen(function* () {
      if (running) return
      running = true
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

    return {
      start,
      stop,
      getTick: Ref.get(stateRef).pipe(Effect.map((s) => s.tick)),
    }
  })
)
```

### 9.2 Tick Pipeline

```
┌──────────────────────────────────────────────────────────────┐
│                    TICK PIPELINE (60 Hz)                       │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  1. Process Inputs ──▶ Validate + queue from WebSocket         │
│  2. Movement       ──▶ world module: physics, collision        │
│  3. Combat         ──▶ combat module: damage, skills           │
│  4. Monster AI     ──▶ monster module: FSM, aggro, pathing     │
│  5. Collisions     ──▶ Spatial queries, overlap resolution     │
│  6. Anti-Cheat     ──▶ Speed check, position validation        │
│  7. Broadcast      ──▶ Delta state to zone subscribers         │
│  8. Tick++         ──▶ Increment tick counter                  │
│                                                                │
│  Target: < 16.67ms per tick at P95                             │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

### 9.3 Input Processing Pipeline

```typescript
// gateway/game-loop/tick-pipeline.ts
const processInputs = (pendingInputs: Map<string, PlayerInput[]>) =>
  Effect.gen(function* () {
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
        if (!rateValid) continue // Silently drop

        // Step 3: Route to appropriate module via message router
        yield* routeMessage(input, playerId)

        // Step 4: Log suspicious patterns
        yield* checkSuspicionScore(playerId, input)
      }
    }
  })
```

---

## 10. State Management

Each module owns its own state. The state hierarchy determines where data lives and how it's synchronized.

### 10.1 State Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                      STATE HIERARCHY                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│    ┌─────────────────────────────────────────────────────┐      │
│    │              Global State (Redis)                    │      │
│    │  • Online players count          [analytics module]  │      │
│    │  • Global leaderboards           [analytics module]  │      │
│    │  • System announcements          [social module]     │      │
│    └─────────────────────────────────────────────────────┘      │
│                            │                                     │
│    ┌─────────────────────────────────────────────────────┐      │
│    │              Floor State (Redis)                     │      │
│    │  • Floor progress (boss status)  [world module]      │      │
│    │  • Floor-specific events         [world module]      │      │
│    │  • Player distribution           [world module]      │      │
│    └─────────────────────────────────────────────────────┘      │
│                            │                                     │
│    ┌─────────────────────────────────────────────────────┐      │
│    │              Zone State (Memory + Redis)             │      │
│    │  • Player positions              [world module]      │      │
│    │  • Monster spawns                [monster module]     │      │
│    │  • Item drops                    [inventory module]   │      │
│    └─────────────────────────────────────────────────────┘      │
│                            │                                     │
│    ┌─────────────────────────────────────────────────────┐      │
│    │              Player State (Postgres + Redis)         │      │
│    │  • Character data                [player module]     │      │
│    │  • Inventory                     [inventory module]  │      │
│    │  • Stats and skills              [player module]     │      │
│    └─────────────────────────────────────────────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 10.2 State Synchronization

```typescript
// State sync with delta compression (in gateway layer)
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
  removed: string[]
}

const broadcastUpdates = (entities: Map<string, EntityState>, tick: number) =>
  Effect.gen(function* () {
    const wsGateway = yield* WebSocketGateway

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
        removed: [],
      }
      yield* wsGateway.broadcastToZone(zoneId, "state_update", update)
    }
  })
```

---

## 11. Zone/Room Architecture

Zone management is owned by the **world module**. Each zone is an independent pub/sub topic.

### 11.1 Zone Sharding Strategy

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

### 11.2 Zone Server Assignment

```typescript
// modules/world/application/zone-manager.ts
interface ZoneAssignment {
  zoneId: ZoneId
  serverId: string
  playerCount: number
  lastRebalance: number
}

// Zone-to-server mapping using consistent hashing
const assignZoneToServer = (zoneId: ZoneId, servers: string[]): string => {
  const hash = hashFunction(zoneId)
  const serverIndex = hash % servers.length
  return servers[serverIndex]
}

// Rebalance when server overloaded
const rebalanceZones = (assignments: ZoneAssignment[]) =>
  Effect.gen(function* () {
    for (const assignment of assignments) {
      if (assignment.playerCount > ZONE_MAX_PLAYERS) {
        const newServer = findLeastLoadedServer()
        yield* migrateZone(assignment.zoneId, newServer)
      }
    }
  })
```

---

## 12. Client Architecture

### 12.1 Client Application Structure

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

### 12.2 Client Prediction & Reconciliation

```typescript
// client/network/prediction.ts
class ClientPrediction {
  private inputSequence = 0
  private pendingInputs: PendingInput[] = []
  private serverState: EntityState | null = null

  processInput(input: PlayerInput): void {
    const seq = this.inputSequence++
    input.sequence = seq

    // Apply prediction immediately
    const predictedState = this.applyPrediction(input)
    this.updateLocalState(predictedState)

    // Queue for reconciliation
    this.pendingInputs.push({ sequence: seq, input, predictedState })

    // Send to server
    this.sendInput(input)
  }

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
      // Snap to server state + re-apply pending inputs
      this.snapToServerState(serverState)
      for (const pending of this.pendingInputs) {
        const corrected = this.applyPrediction(pending.input)
        this.updateLocalState(corrected)
      }
    }
  }
}
```

---

## 13. Caching Strategy

Each module accesses caching through the shared `CacheService` via its outbound ports. The caching strategy follows a three-tier approach.

### 13.1 Cache Layers

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
│    │  • Player sessions            [identity module]      │      │
│    │  • Online player list         [analytics module]     │      │
│    │  • Leaderboards (sorted sets) [analytics module]     │      │
│    │  • Zone player counts         [world module]         │      │
│    │  TTL: Minutes to Hours                               │      │
│    └─────────────────────────────────────────────────────┘      │
│                                                                  │
│    L3: PostgreSQL (Persistent)                                 │
│    ┌─────────────────────────────────────────────────────┐      │
│    │  • Player characters          [player module]        │      │
│    │  • Inventory                  [inventory module]     │      │
│    │  • Quest progress             [quest module]         │      │
│    │  • Transaction history        [economy module]       │      │
│    │  TTL: Forever (with backups)                         │      │
│    └─────────────────────────────────────────────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 13.2 Cache Invalidation via Events

Modules invalidate caches by reacting to domain events, keeping cache logic decoupled:

```typescript
// modules/economy/events/subscriptions.ts
// When a trade completes, invalidate both players' cached data
eventBus.subscribe("TradeCompleted", (event) =>
  Effect.gen(function* () {
    const cache = yield* CacheService

    // Invalidate both players' inventory caches
    yield* cache.invalidate(`player:${event.playerA}`)
    yield* cache.invalidate(`player:${event.playerB}`)

    // Invalidate economy-specific caches
    yield* cache.invalidate(`trade:${event.tradeId}`)
  })
)
```

---

## 14. Logging & Observability

### 14.1 Structured Logging

```typescript
// shared/infrastructure/config/logger.ts
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
    Logger.withLogAnnotation("version", "2.0.0")
  )
)

// Usage in any module
const processPlayerAction = (playerId: PlayerId, action: PlayerAction) =>
  Effect.gen(function* () {
    yield* Effect.logInfo("Processing player action", {
      playerId,
      action: action.type,
      timestamp: Date.now(),
    })

    // ... process action

    yield* Effect.logDebug("Action processed", {
      playerId,
      action: action.type,
      duration: Date.now() - action.timestamp,
    })
  })
```

### 14.2 Metrics Collection

```typescript
// Metrics collected per module, aggregated at infrastructure level
import { Effect, Metric } from "effect"

// Gateway metrics
const playerCountGauge = Metric.gauge("game_players_online")
const tickDurationHistogram = Metric.histogram("game_tick_duration_millis", {
  boundaries: [1, 5, 10, 16, 20, 30, 50, 100],
})
const messagesPerSecond = Metric.counter("game_messages_total")

// Combat module metrics
const combatEventsCounter = Metric.counter("game_combat_events_total")

// Economy module metrics
const tradesCounter = Metric.counter("game_trades_total")
const colTransferredCounter = Metric.counter("game_col_transferred_total")

// Record metrics in game loop
const gameTick = Effect.gen(function* () {
  const startTime = Date.now()

  // ... game logic ...

  const duration = Date.now() - startTime
  yield* Metric.update(tickDurationHistogram, duration)

  const playerCount = yield* getPlayerCount()
  yield* Metric.set(playerCountGauge, playerCount)
})
```

---

## 15. Layer Composition

The main entry point composes all infrastructure, modules, and gateway layers into a single application.

### 15.1 Composition Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                    LAYER COMPOSITION                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│    ┌─────────────────────────────────────────────────────┐      │
│    │                 GatewayLayer                         │      │
│    │  WebSocketGateway + GameLoopService + HttpRoutes    │      │
│    └────────────────────────┬────────────────────────────┘      │
│                             │ depends on                         │
│    ┌────────────────────────▼────────────────────────────┐      │
│    │                 ModuleLayer                          │      │
│    │  Identity + Player + Combat + Monster + Inventory   │      │
│    │  + Economy + Social + World + Quest + Analytics     │      │
│    └────────────────────────┬────────────────────────────┘      │
│                             │ depends on                         │
│    ┌────────────────────────▼────────────────────────────┐      │
│    │              InfrastructureLayer                     │      │
│    │  Database + Cache + EventBus + Config               │      │
│    └─────────────────────────────────────────────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 15.2 Main Entry Point

```typescript
// index.ts
import { Layer } from "effect"
import { BunRuntime } from "@effect/platform-bun"

// Infrastructure
import { DatabaseLive } from "@/shared/infrastructure/database"
import { CacheLive } from "@/shared/infrastructure/cache"
import { InMemoryEventBusLive } from "@/shared/infrastructure/event-bus"
import { ConfigLive } from "@/shared/infrastructure/config"

// Modules
import { IdentityModule } from "@/modules/identity"
import { PlayerModule } from "@/modules/player"
import { CombatModule } from "@/modules/combat"
import { MonsterModule } from "@/modules/monster"
import { InventoryModule } from "@/modules/inventory"
import { EconomyModule } from "@/modules/economy"
import { SocialModule } from "@/modules/social"
import { WorldModule } from "@/modules/world"
import { QuestModule } from "@/modules/quest"
import { AnalyticsModule } from "@/modules/analytics"

// Gateway
import { WebSocketGatewayLive } from "@/gateway/websocket/server"
import { GameLoopLive } from "@/gateway/game-loop/game-loop"
import { HttpRoutesLive } from "@/gateway/http/routes"

// Layer 1: Infrastructure (no dependencies)
const InfrastructureLayer = Layer.mergeAll(
  DatabaseLive,
  CacheLive,
  InMemoryEventBusLive,
  ConfigLive
)

// Layer 2: Modules (depend on infrastructure)
const ModuleLayer = Layer.mergeAll(
  IdentityModule,
  PlayerModule,
  CombatModule,
  MonsterModule,
  InventoryModule,
  EconomyModule,
  SocialModule,
  WorldModule,
  QuestModule,
  AnalyticsModule
).pipe(Layer.provide(InfrastructureLayer))

// Layer 3: Gateway (depends on modules)
const GatewayLayer = Layer.mergeAll(
  WebSocketGatewayLive,
  GameLoopLive,
  HttpRoutesLive
).pipe(Layer.provide(ModuleLayer))

// Launch the application
Layer.launch(GatewayLayer).pipe(BunRuntime.runMain)
```

---

## Appendix A: Configuration

```typescript
// shared/infrastructure/config/index.ts
import { Config, Layer } from "effect"

const AppConfig = Config.all({
  server: Config.all({
    port: Config.number("PORT").pipe(Config.withDefault(8080)),
    host: Config.string("HOST").pipe(Config.withDefault("0.0.0.0")),
    reusePort: Config.boolean("REUSE_PORT").pipe(Config.withDefault(true)),
    idleTimeout: Config.number("IDLE_TIMEOUT").pipe(Config.withDefault(120)),
  }),

  database: Config.all({
    host: Config.string("DB_HOST"),
    port: Config.number("DB_PORT").pipe(Config.withDefault(5432)),
    name: Config.string("DB_NAME"),
    user: Config.string("DB_USER"),
    password: Config.secret("DB_PASSWORD"),
    poolSize: Config.number("DB_POOL_SIZE").pipe(Config.withDefault(20)),
  }),

  redis: Config.all({
    host: Config.string("REDIS_HOST").pipe(Config.withDefault("localhost")),
    port: Config.number("REDIS_PORT").pipe(Config.withDefault(6379)),
    password: Config.option(Config.secret("REDIS_PASSWORD")),
  }),

  game: Config.all({
    tickRate: Config.number("TICK_RATE").pipe(Config.withDefault(60)),
    maxPlayersPerZone: Config.number("MAX_PLAYERS_PER_ZONE").pipe(Config.withDefault(500)),
    maxMessageSize: Config.number("MAX_MESSAGE_SIZE").pipe(Config.withDefault(65536)),
  }),
})
```

---

**Document Version:** 2.0.0
**Last Updated:** February 2026
**Owner:** Architecture Team
