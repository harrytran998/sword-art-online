# Sword Art Online: Aincrad Online
## Security Architecture Document

**Version:** 1.0.0  
**Date:** February 2026  
**Status:** Planning Phase

---

## Table of Contents

1. [Security Philosophy](#1-security-philosophy)
2. [Threat Model](#2-threat-model)
3. [Server-Authoritative Architecture](#3-server-authoritative-architecture)
4. [Authentication & Authorization](#4-authentication--authorization)
5. [Input Validation](#5-input-validation)
6. [Anti-Cheat System](#6-anti-cheat-system)
7. [Economy Security](#7-economy-security)
8. [Network Security](#8-network-security)
9. [Data Security](#9-data-security)
10. [Incident Response](#10-incident-response)
11. [Security Checklist](#11-security-checklist)

---

## 1. Security Philosophy

### 1.1 Core Principles

| Principle | Description |
|-----------|-------------|
| **Zero Trust** | Never trust client data; validate everything server-side |
| **Defense in Depth** | Multiple layers of security controls |
| **Fail Secure** | Default to denial on any validation failure |
| **Audit Everything** | Log all security-relevant events |
| **Least Privilege** | Minimum necessary permissions |

### 1.2 Security Goals

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY OBJECTIVES                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│    ┌─────────────────────────────────────────────────────┐      │
│    │   1. PREVENT CHEATING                                │      │
│    │   • No speed hacks, teleportation, or damage hacks  │      │
│    │   • No economy manipulation                          │      │
│    │   • No packet manipulation                           │      │
│    └─────────────────────────────────────────────────────┘      │
│                                                                  │
│    ┌─────────────────────────────────────────────────────┐      │
│    │   2. PROTECT PLAYER DATA                             │      │
│    │   • Secure authentication                            │      │
│    │   • Encrypted communications                         │      │
│    │   • Privacy protection                               │      │
│    └─────────────────────────────────────────────────────┘      │
│                                                                  │
│    ┌─────────────────────────────────────────────────────┐      │
│    │   3. ENSURE FAIR PLAY                                │      │
│    │   • No player advantages through exploits           │      │
│    │   • Level playing field                              │      │
│    │   • Consistent game rules                            │      │
│    └─────────────────────────────────────────────────────┘      │
│                                                                  │
│    ┌─────────────────────────────────────────────────────┐      │
│    │   4. PROTECT SERVICE AVAILABILITY                    │      │
│    │   • DDoS protection                                  │      │
│    │   • Rate limiting                                    │      │
│    │   • Graceful degradation                             │      │
│    └─────────────────────────────────────────────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Threat Model

### 2.1 Attack Vectors

```
┌─────────────────────────────────────────────────────────────────┐
│                      THREAT LANDSCAPE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│    CLIENT-SIDE ATTACKS:                                         │
│    ├── Memory Editing (Cheat Engine)                            │
│    ├── Packet Manipulation (WebSocket interception)            │
│    ├── Speed Hacks (Time manipulation)                         │
│    ├── Botting (Automation scripts)                            │
│    ├── Client Modification (Source code changes)               │
│    └── Browser DevTools Exploitation                           │
│                                                                  │
│    NETWORK ATTACKS:                                             │
│    ├── DDoS (Distributed Denial of Service)                    │
│    ├── Man-in-the-Middle (MITM)                                │
│    ├── Session Hijacking                                       │
│    ├── Cross-Site WebSocket Hijacking (CSWSH)                  │
│    └── Replay Attacks                                          │
│                                                                  │
│    GAME LOGIC EXPLOITS:                                         │
│    ├── Economy Manipulation (Duplication, inflation)           │
│    ├── Combat Exploits (Damage, range, speed)                  │
│    ├── Movement Exploits (Teleportation, noclip)               │
│    ├── Race Conditions (Inventory, trades)                     │
│    └── Logic Bugs (Quest, achievements)                        │
│                                                                  │
│    SOCIAL ENGINEERING:                                          │
│    ├── Phishing (Fake login pages)                             │
│    ├── Account Theft (Credential stuffing)                     │
│    ├── Social Manipulation (Scams, RMT)                        │
│    └── Impersonation                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Threat Severity Matrix

| Threat | Impact | Likelihood | Priority |
|--------|--------|------------|----------|
| Speed Hacking | High | High | **P0** |
| Teleportation | High | High | **P0** |
| Packet Manipulation | High | High | **P0** |
| Economy Duplication | Critical | Medium | **P0** |
| Session Hijacking | High | Medium | **P1** |
| DDoS | High | Medium | **P1** |
| Botting | Medium | High | **P1** |
| Memory Editing | Medium | Medium | **P2** |
| Phishing | High | Low | **P2** |

---

## 3. Server-Authoritative Architecture

### 3.1 Core Principle

> **The server is the ONLY source of truth. The client is a dumb terminal that sends inputs and renders state.**

### 3.2 Architecture Comparison

```
┌─────────────────────────────────────────────────────────────────┐
│                CLIENT-AUTHORITATIVE (INSECURE)                   │
│                ❌ NEVER USE IN PRODUCTION                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│    Client                        Server                         │
│    ┌─────────────────┐          ┌─────────────────┐            │
│    │ "I moved to     │─────────▶│ OK, saved.      │            │
│    │  position X,Y"  │          │                 │            │
│    └─────────────────┘          └─────────────────┘            │
│                                                                  │
│    VULNERABILITIES:                                             │
│    • Client can claim any position                              │
│    • No validation of movement speed                            │
│    • Impossible to detect teleportation                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                SERVER-AUTHORITATIVE (SECURE)                     │
│                ✅ REQUIRED FOR ALL GAME LOGIC                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│    Client                        Server                         │
│    ┌─────────────────┐          ┌─────────────────┐            │
│    │ "I want to move │─────────▶│ Validate input  │            │
│    │  north"         │          │ Calculate speed │            │
│    │                 │          │ Check collision │            │
│    │                 │◀─────────│ Apply movement  │            │
│    │ "You are now at │          │ Return position │            │
│    │  X,Y"           │          │                 │            │
│    └─────────────────┘          └─────────────────┘            │
│                                                                  │
│    SECURITY BENEFITS:                                           │
│    • Server calculates all positions                            │
│    • Speed limits enforced server-side                          │
│    • Impossible to teleport                                     │
│    • All combat calculated server-side                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Implementation Pattern

```typescript
// ❌ WRONG: Trusting client state
const handleMovementWrong = (playerId: string, newPosition: Position) =>
  Effect.gen(function* () {
    const player = yield* playerService.getPlayer(playerId)
    player.position = newPosition  // TRUSTS CLIENT!
    yield* playerService.save(player)
  })

// ✅ CORRECT: Server-authoritative
const handleMovementCorrect = (playerId: string, input: MovementInput) =>
  Effect.gen(function* () {
    const player = yield* playerService.getPlayer(playerId)
    
    // 1. Validate input format
    yield* validateMovementInput(input)
    
    // 2. Calculate new position SERVER-SIDE
    const newVelocity = calculateVelocity(input.direction, player.moveSpeed)
    const newPosition = applyPhysics(player.position, newVelocity, TICK_INTERVAL)
    
    // 3. Validate calculated position
    const maxMoveDistance = player.moveSpeed * TICK_INTERVAL
    const actualDistance = calculateDistance(player.position, newPosition)
    
    if (actualDistance > maxMoveDistance * 2) {
      // Suspicious - log and reject
      yield* securityService.logSuspiciousActivity(playerId, "SPEED_HACK", {
        expected: maxMoveDistance,
        actual: actualDistance
      })
      return yield* Effect.fail(new SpeedHackDetectedError())
    }
    
    // 4. Check collision
    const collision = yield* physicsService.checkCollision(newPosition)
    if (collision) {
      return yield* Effect.fail(new CollisionError())
    }
    
    // 5. Apply valid movement
    player.position = newPosition
    player.velocity = newVelocity
    yield* playerService.save(player)
    
    return { position: newPosition, velocity: newVelocity }
  })
```

---

## 4. Authentication & Authorization

### 4.1 JWT-Based Authentication

```typescript
// JWT Token Structure
interface GameToken {
  // Header
  alg: "HS256"
  typ: "JWT"
  
  // Payload
  sub: string        // Account ID
  pid: string        // Character ID
  jti: string        // Unique token ID (for revocation)
  iat: number        // Issued at
  exp: number        // Expiration (1 hour)
  iss: "aincrad-online.com"
  aud: "aincrad-game"
  
  // Custom claims
  role: "player" | "moderator" | "admin"
  permissions: string[]
}

// Token Generation
const generateToken = (account: Account, character: Character): Effect.Effect<string> =>
  Effect.gen(function* () {
    const config = yield* Config.auth
    
    const payload: GameToken = {
      sub: account.id,
      pid: character.id,
      jti: crypto.randomUUID(),
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
      iss: config.issuer,
      aud: config.audience,
      role: account.role,
      permissions: account.permissions
    }
    
    return jwt.sign(payload, config.secret, { algorithm: "HS256" })
  })

// Token Validation
const validateToken = (token: string): Effect.Effect<GameToken, AuthError> =>
  Effect.gen(function* () {
    const config = yield* Config.auth
    
    // 1. Verify signature and decode
    let decoded: GameToken
    try {
      decoded = jwt.verify(token, config.secret, {
        algorithms: ["HS256"],
        issuer: config.issuer,
        audience: config.audience,
        maxAge: "1h"
      }) as GameToken
    } catch (error) {
      return yield* Effect.fail(new InvalidTokenError({ reason: error.message }))
    }
    
    // 2. Check if token is revoked
    const cache = yield* CacheService
    const isRevoked = yield* cache.get(`revoked:${decoded.jti}`)
    if (isRevoked) {
      return yield* Effect.fail(new TokenRevokedError())
    }
    
    // 3. Validate account still active
    const account = yield* accountService.getAccount(decoded.sub)
    if (account.status !== "active") {
      return yield* Effect.fail(new AccountSuspendedError())
    }
    
    return decoded
  })
```

### 4.2 WebSocket Authentication

```typescript
// WebSocket upgrade authentication
const authenticateWebSocket = (request: Request): Effect.Effect<WebSocketData, AuthError> =>
  Effect.gen(function* () {
    const url = new URL(request.url)
    const token = url.searchParams.get("token")
    
    // 1. Validate Origin (CSWSH protection)
    const origin = request.headers.get("origin")
    const allowedOrigins = yield* Config.allowedOrigins
    
    if (!origin || !allowedOrigins.includes(origin)) {
      yield* securityService.logSecurityEvent({
        type: "CSWSH_ATTEMPT",
        origin,
        ip: request.headers.get("x-forwarded-for")
      })
      return yield* Effect.fail(new OriginNotAllowedError({ origin }))
    }
    
    // 2. Validate token
    const decoded = yield* validateToken(token)
    
    // 3. Check IP-based rate limit
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    const rateLimiter = yield* RateLimiterService
    const allowed = yield* rateLimiter.checkConnection(ip)
    
    if (!allowed) {
      return yield* Effect.fail(new RateLimitedError())
    }
    
    // 4. Check for existing session (single session per player)
    const cache = yield* CacheService
    const existingSession = yield* cache.get(`session:${decoded.pid}`)
    
    if (existingSession) {
      // Force disconnect existing session
      yield* disconnectPlayer(decoded.pid, "New login detected")
    }
    
    // 5. Create new session
    const sessionData: WebSocketData = {
      playerId: decoded.pid,
      accountId: decoded.sub,
      sessionToken: decoded.jti,
      role: decoded.role,
      permissions: decoded.permissions,
      ip,
      connectedAt: Date.now()
    }
    
    // 6. Store session
    yield* cache.set(`session:${decoded.pid}`, sessionData, 3600)
    
    return sessionData
  })
```

### 4.3 Role-Based Access Control (RBAC)

```typescript
// Permission definitions
const PERMISSIONS = {
  // Player permissions
  PLAYER_BASIC: ["move", "attack", "chat", "trade", "party", "guild"],
  
  // Moderator permissions
  MODERATOR: [
    ...PERMISSIONS.PLAYER_BASIC,
    "kick", "mute", "warn", "teleport", "inspect", "chat_clear"
  ],
  
  // Admin permissions
  ADMIN: [
    ...PERMISSIONS.MODERATOR,
    "ban", "unban", "spawn_item", "set_level", "set_col", "server_announce"
  ]
}

// Permission check middleware
const checkPermission = (permission: string) =>
  Effect.gen(function* () {
    const session = yield* SessionContext
    
    if (!session.permissions.includes(permission)) {
      return yield* Effect.fail(new PermissionDeniedError({
        required: permission,
        actual: session.permissions
      }))
    }
  })

// Usage in handlers
const handleKickPlayer = (targetId: string, reason: string) =>
  Effect.gen(function* () {
    // Check permission
    yield* checkPermission("kick")
    
    // Execute kick
    yield* moderationService.kickPlayer(targetId, reason)
  })
```

---

## 5. Input Validation

### 5.1 Validation Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                    VALIDATION PIPELINE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│    Layer 1: STRUCTURAL VALIDATION                               │
│    ├── JSON parse check                                         │
│    ├── Required fields present                                  │
│    ├── Field types correct                                      │
│    └── Field lengths within limits                              │
│                                                                  │
│    Layer 2: SEMANTIC VALIDATION                                 │
│    ├── Enum values valid                                        │
│    ├── Numeric ranges valid                                     │
│    ├── References exist (skill IDs, item IDs)                   │
│    └── String formats valid (regex)                             │
│                                                                  │
│    Layer 3: BUSINESS LOGIC VALIDATION                           │
│    ├── Player owns referenced items                             │
│    ├── Target is in range                                       │
│    ├── Cooldowns not active                                     │
│    ├── Resources available (MP, stamina)                        │
│    └── Prerequisites met (level, quest completion)              │
│                                                                  │
│    Layer 4: ANTI-CHEAT VALIDATION                               │
│    ├── Movement speed within bounds                             │
│    ├── Action rate within limits                                │
│    ├── Position within world bounds                             │
│    └── Timestamp not in future/past                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Validation Implementation

```typescript
// Message schema validator
import { Schema } from "effect"

// Define message schemas
const MovementStartSchema = Schema.Struct({
  type: Schema.Literal("movement_start"),
  direction: Schema.Union(
    Schema.Literal("north"),
    Schema.Literal("south"),
    Schema.Literal("east"),
    Schema.Literal("west")
  ),
  timestamp: Schema.Number.pipe(
    Schema.filter((n) => n > 0 && n <= Date.now() + 5000, {
      message: "Timestamp must not be in the future"
    })
  ),
  sequence: Schema.Number.pipe(Schema.int(), Schema.positive())
})

// Validation middleware
const validateMessage = <A>(schema: Schema.Schema<A>) =>
  (message: unknown): Effect.Effect<A, ValidationError> =>
    Schema.decodeUnknown(schema)(message).pipe(
      Effect.mapError((error) => new ValidationError({ 
        message: error.message,
        details: error.errors 
      }))
    )

// Usage in handler
const handleMovementStart = (playerId: string, message: unknown) =>
  Effect.gen(function* () {
    // Layer 1 & 2: Schema validation
    const valid = yield* validateMessage(MovementStartSchema)(message)
    
    // Layer 3: Business logic validation
    const player = yield* playerService.getPlayer(playerId)
    if (player.status === "stunned") {
      return yield* Effect.fail(new ActionBlockedError({ reason: "Player is stunned" }))
    }
    
    // Layer 4: Anti-cheat validation
    const lastMove = yield* cacheService.get(`last_move:${playerId}`)
    if (lastMove && Date.now() - lastMove < 16) {
      yield* securityService.logSuspiciousActivity(playerId, "FAST_INPUT", {})
      return yield* Effect.fail(new RateLimitedError())
    }
    
    // Process valid input
    yield* movementService.startMovement(playerId, valid.direction)
    yield* cacheService.set(`last_move:${playerId}`, Date.now(), 1)
  })
```

---

## 6. Anti-Cheat System

### 6.1 Speed Hack Detection

```typescript
class SpeedHackDetector {
  private movementHistory = new Map<string, MovementRecord[]>()
  
  checkMovementSpeed(
    playerId: string,
    fromPosition: Position,
    toPosition: Position,
    deltaTime: number
  ): Effect.Effect<boolean, SpeedHackError> {
    return Effect.gen(function* () {
      const player = yield* playerService.getPlayer(playerId)
      
      // Calculate actual movement
      const distance = this.calculateDistance(fromPosition, toPosition)
      const speed = distance / (deltaTime / 1000) // units per second
      
      // Get max allowed speed (base + buffs + equipment)
      const maxSpeed = player.maxMoveSpeed
      const burstMultiplier = 2.5 // Allow brief bursts
      const maxBurstSpeed = maxSpeed * burstMultiplier
      
      // Check immediate speed violation
      if (speed > maxBurstSpeed) {
        yield* this.logViolation(playerId, "SPEED_HACK_IMMEDIATE", {
          detectedSpeed: speed,
          maxAllowed: maxBurstSpeed,
          distance,
          deltaTime
        })
        
        return yield* Effect.fail(new SpeedHackError({
          speed,
          maxSpeed: maxBurstSpeed
        }))
      }
      
      // Check average speed over time
      const history = this.getHistory(playerId)
      history.push({ position: toPosition, timestamp: Date.now(), speed })
      
      // Keep last 5 seconds of movement
      const recentHistory = history.filter(h => Date.now() - h.timestamp < 5000)
      this.movementHistory.set(playerId, recentHistory)
      
      if (recentHistory.length > 10) {
        const avgSpeed = recentHistory.reduce((sum, h) => sum + h.speed, 0) / recentHistory.length
        
        if (avgSpeed > maxSpeed * 1.5) {
          yield* this.logViolation(playerId, "SPEED_HACK_AVERAGE", {
            averageSpeed: avgSpeed,
            maxAllowed: maxSpeed
          })
          
          return yield* Effect.fail(new SpeedHackError({
            speed: avgSpeed,
            maxSpeed
          }))
        }
      }
      
      return true
    })
  }
  
  private logViolation(playerId: string, type: string, data: Record<string, unknown>) {
    return Effect.gen(function* () {
      yield* securityService.logSecurityEvent({
        type,
        playerId,
        data,
        timestamp: Date.now(),
        severity: "HIGH"
      })
      
      // Increment violation counter
      const violations = yield* cacheService.increment(`violations:${playerId}`)
      
      // Auto-ban after 10 violations in 1 hour
      if (violations >= 10) {
        yield* moderationService.autoBan(playerId, "Repeated speed hack violations", 24)
      }
    })
  }
}
```

### 6.2 Teleportation Detection

```typescript
class TeleportationDetector {
  validatePosition(
    playerId: string,
    currentPosition: Position,
    newPosition: Position,
    deltaTime: number
  ): Effect.Effect<Position, TeleportationError> {
    return Effect.gen(function* () {
      // Check if position change is valid
      
      // 1. Check world bounds
      if (!this.isWithinWorldBounds(newPosition)) {
        yield* this.logViolation(playerId, "OUT_OF_BOUNDS", { newPosition })
        return yield* Effect.fail(new TeleportationError({
          reason: "Position out of world bounds"
        }))
      }
      
      // 2. Check distance vs max possible movement
      const player = yield* playerService.getPlayer(playerId)
      const maxMoveDistance = player.maxMoveSpeed * (deltaTime / 1000)
      const actualDistance = this.calculateDistance(currentPosition, newPosition)
      
      if (actualDistance > maxMoveDistance * 3) {
        // Potential teleportation
        yield* this.logViolation(playerId, "TELEPORTATION", {
          from: currentPosition,
          to: newPosition,
          distance: actualDistance,
          maxPossible: maxMoveDistance * 3
        })
        
        // Rollback to last valid position
        return yield* Effect.fail(new TeleportationError({
          reason: "Impossible movement detected",
          correctedPosition: currentPosition
        }))
      }
      
      // 3. Check for noclip (moving through walls)
      const hasCollision = yield* physicsService.raycast(currentPosition, newPosition)
      if (hasCollision) {
        yield* this.logViolation(playerId, "NOCLIP", {
          from: currentPosition,
          to: newPosition
        })
        
        return yield* Effect.fail(new TeleportationError({
          reason: "Movement through collision detected"
        }))
      }
      
      return newPosition
    })
  }
}
```

### 6.3 Combat Cheat Detection

```typescript
class CombatCheatDetector {
  validateAttack(
    attackerId: string,
    targetId: string,
    skillId: number
  ): Effect.Effect<void, CombatCheatError> {
    return Effect.gen(function* () {
      const attacker = yield* playerService.getPlayer(attackerId)
      const target = yield* entityService.getEntity(targetId)
      
      // 1. Range check
      const distance = this.calculateDistance(attacker.position, target.position)
      const skill = yield* skillService.getSkill(skillId)
      
      if (distance > skill.range * 1.1) { // 10% tolerance for lag
        yield* this.logViolation(attackerId, "RANGE_HACK", {
          distance,
          maxRange: skill.range,
          targetId
        })
        
        return yield* Effect.fail(new CombatCheatError({
          reason: "Target out of range"
        }))
      }
      
      // 2. Line of sight check
      const hasLineOfSight = yield* physicsService.checkLineOfSight(
        attacker.position,
        target.position
      )
      
      if (!hasLineOfSight) {
        yield* this.logViolation(attackerId, "WALL_HACK", {
          attackerPosition: attacker.position,
          targetPosition: target.position
        })
        
        return yield* Effect.fail(new CombatCheatError({
          reason: "No line of sight to target"
        }))
      }
      
      // 3. Cooldown check
      const lastUse = yield* cacheService.get(`skill_cd:${attackerId}:${skillId}`)
      if (lastUse && Date.now() - lastUse < skill.cooldownMs) {
        yield* this.logViolation(attackerId, "COOLDOWN_HACK", {
          skillId,
          lastUse,
          cooldown: skill.cooldownMs,
          timeSince: Date.now() - lastUse
        })
        
        return yield* Effect.fail(new CombatCheatError({
          reason: "Skill on cooldown"
        }))
      }
      
      // 4. Resource check
      if (attacker.mp < skill.mpCost) {
        yield* this.logViolation(attackerId, "RESOURCE_HACK", {
          required: skill.mpCost,
          available: attacker.mp
        })
        
        return yield* Effect.fail(new CombatCheatError({
          reason: "Insufficient MP"
        }))
      }
      
      // 5. Action rate check
      const recentActions = yield* cacheService.get(`actions:${attackerId}`) || []
      const actionsPerSecond = recentActions.filter(t => Date.now() - t < 1000).length
      
      if (actionsPerSecond > 10) {
        yield* this.logViolation(attackerId, "ACTION_RATE_HACK", {
          actionsPerSecond
        })
        
        return yield* Effect.fail(new CombatCheatError({
          reason: "Action rate exceeded"
        }))
      }
    })
  }
}
```

### 6.4 Bot Detection

```typescript
class BotDetector {
  private activityPatterns = new Map<string, ActivityPattern>()
  
  analyzeBehavior(playerId: string): Effect.Effect<BotDetectionResult> {
    return Effect.gen(function* () {
      const pattern = this.activityPatterns.get(playerId) || this.createEmptyPattern()
      
      // 1. Check action timing patterns
      const timingVariation = this.calculateTimingVariation(pattern.actionIntervals)
      if (timingVariation < 50) { // Too consistent (bots)
        yield* this.flagAsSuspicious(playerId, "PERFECT_TIMING", {
          variation: timingVariation
        })
      }
      
      // 2. Check movement patterns
      if (pattern.repetitiveMovements > 100) {
        yield* this.flagAsSuspicious(playerId, "REPETITIVE_MOVEMENT", {
          count: pattern.repetitiveMovements
        })
      }
      
      // 3. Check action frequency
      const actionsPerMinute = pattern.recentActions.filter(
        a => Date.now() - a.timestamp < 60000
      ).length
      
      if (actionsPerMinute > 600) { // More than 10 actions per second
        yield* this.flagAsSuspicious(playerId, "SUPERHUMAN_SPEED", {
          actionsPerMinute
        })
      }
      
      // 4. Check for AFK behavior while active
      if (pattern.playtimeMinutes > 60 && pattern.uniqueActions < 5) {
        yield* this.flagAsSuspicious(playerId, "SIMPLE_BOT", {
          uniqueActions: pattern.uniqueActions,
          playtime: pattern.playtimeMinutes
        })
      }
      
      // 5. ML-based detection (future)
      const mlScore = yield* mlDetectionService.analyze(pattern)
      if (mlScore > 0.8) {
        yield* this.flagAsSuspicious(playerId, "ML_DETECTED", {
          score: mlScore
        })
      }
      
      return {
        isBot: pattern.suspicionScore > 80,
        suspicionScore: pattern.suspicionScore,
        flags: pattern.flags
      }
    })
  }
}
```

---

## 7. Economy Security

### 7.1 Transaction Security

```typescript
class SecureTransaction {
  // Atomic trade execution
  executeTrade(
    playerA: string,
    playerB: string,
    itemsA: TradeItem[],
    itemsB: TradeItem[],
    colA: number,
    colB: number
  ): Effect.Effect<void, TransactionError> {
    return Effect.gen(function* () {
      // Use database transaction for atomicity
      yield* databaseService.transaction(function* () {
        // 1. Lock both player inventories
        const lockA = yield* inventoryService.acquireLock(playerA)
        const lockB = yield* inventoryService.acquireLock(playerB)
        
        try {
          // 2. Validate both sides
          yield* this.validateTradeItems(playerA, itemsA)
          yield* this.validateTradeItems(playerB, itemsB)
          yield* this.validateCol(playerA, colA)
          yield* this.validateCol(playerB, colB)
          
          // 3. Remove items from A
          for (const item of itemsA) {
            yield* inventoryService.removeItem(playerA, item.id, item.quantity)
          }
          
          // 4. Remove items from B
          for (const item of itemsB) {
            yield* inventoryService.removeItem(playerB, item.id, item.quantity)
          }
          
          // 5. Transfer col
          yield* economyService.transferCol(playerA, playerB, colA)
          yield* economyService.transferCol(playerB, playerA, colB)
          
          // 6. Add items to A (from B)
          for (const item of itemsB) {
            yield* inventoryService.addItem(playerA, item)
          }
          
          // 7. Add items to B (from A)
          for (const item of itemsA) {
            yield* inventoryService.addItem(playerB, item)
          }
          
          // 8. Log transaction
          yield* auditService.logTransaction({
            type: "TRADE",
            playerA,
            playerB,
            itemsA,
            itemsB,
            colA,
            colB,
            timestamp: Date.now()
          })
          
        } finally {
          // 9. Release locks
          yield* inventoryService.releaseLock(lockA)
          yield* inventoryService.releaseLock(lockB)
        }
      })
    })
  }
  
  // Validate trade fairness (anti-RMT)
  validateTradeFairness(itemsA: TradeItem[], itemsB: TradeItem[], colA: number, colB: number) {
    return Effect.gen(function* () {
      const valueA = yield* this.calculateMarketValue(itemsA) + colA
      const valueB = yield* this.calculateMarketValue(itemsB) + colB
      
      // Flag unfair trades (potential RMT)
      const ratio = Math.max(valueA, valueB) / Math.min(valueA, valueB)
      
      if (ratio > 10 && Math.min(valueA, valueB) > 10000) {
        // Highly unbalanced trade with significant value
        yield* securityService.flagForReview({
          type: "SUSPICIOUS_TRADE",
          valueA,
          valueB,
          ratio
        })
      }
    })
  }
}
```

### 7.2 Item Duplication Prevention

```typescript
class DuplicationPrevention {
  private processedTransactions = new Set<string>()
  
  // Prevent replay attacks
  processItemTransaction(transactionId: string, operation: () => Effect.Effect<void>) {
    return Effect.gen(function* () {
      // Check if transaction already processed
      if (this.processedTransactions.has(transactionId)) {
        yield* securityService.logSecurityEvent({
          type: "DUPLICATE_TRANSACTION",
          transactionId
        })
        return yield* Effect.fail(new DuplicateTransactionError())
      }
      
      // Mark as processing
      this.processedTransactions.add(transactionId)
      
      // Execute operation
      yield* operation()
      
      // Set TTL on transaction record
      yield* cacheService.set(`tx:${transactionId}`, true, 86400) // 24 hours
    })
  }
  
  // Inventory state validation
  validateInventoryState(playerId: string): Effect.Effect<void> {
    return Effect.gen(function* () {
      const inventory = yield* inventoryService.getInventory(playerId)
      
      // Check for impossible items
      for (const item of inventory.items) {
        // Negative quantity
        if (item.quantity < 0) {
          yield* this.handleExploit(playerId, "NEGATIVE_QUANTITY", item)
        }
        
        // Exceeds stack limit
        if (item.quantity > item.definition.maxStack) {
          yield* this.handleExploit(playerId, "STACK_OVERFLOW", item)
        }
        
        // Invalid enhancement level
        if (item.enhancementLevel > 20) {
          yield* this.handleExploit(playerId, "INVALID_ENHANCEMENT", item)
        }
      }
      
      // Check total inventory value against database
      const dbTotal = yield* databaseService.queryOne<{ total: number }>(
        "SELECT SUM(quantity) as total FROM character_inventory WHERE character_id = $1",
        [playerId]
      )
      
      const cacheTotal = inventory.items.reduce((sum, item) => sum + item.quantity, 0)
      
      if (dbTotal.total !== cacheTotal) {
        yield* this.handleExploit(playerId, "INVENTORY_MISMATCH", {
          dbTotal: dbTotal.total,
          cacheTotal
        })
      }
    })
  }
}
```

---

## 8. Network Security

### 8.1 TLS/WSS Configuration

```typescript
// Enforce WSS (WebSocket Secure) in production
const createWebSocketServer = () => {
  if (process.env.NODE_ENV === "production") {
    // Production: Must use WSS
    if (!config.useSSL) {
      throw new Error("SSL is required in production")
    }
  }
  
  // Bun WebSocket server with TLS
  Bun.serve({
    tls: {
      cert: fs.readFileSync(config.ssl.certPath),
      key: fs.readFileSync(config.ssl.keyPath),
    },
    fetch: handleUpgrade,
    websocket: websocketHandlers
  })
}
```

### 8.2 Origin Validation (CSWSH Prevention)

```typescript
const validateOrigin = (request: Request): Effect.Effect<void, SecurityError> =>
  Effect.gen(function* () {
    const origin = request.headers.get("origin")
    
    // STRICT allowlist - never use denylist
    const allowedOrigins = [
      "https://aincrad-online.com",
      "https://www.aincrad-online.com",
      "https://game.aincrad-online.com"
    ]
    
    if (!origin) {
      yield* securityService.logSecurityEvent({
        type: "MISSING_ORIGIN",
        ip: request.headers.get("x-forwarded-for")
      })
      return yield* Effect.fail(new OriginNotAllowedError())
    }
    
    // Case-sensitive exact match
    if (!allowedOrigins.includes(origin)) {
      yield* securityService.logSecurityEvent({
        type: "CSWSH_ATTEMPT",
        origin,
        ip: request.headers.get("x-forwarded-for")
      })
      return yield* Effect.fail(new OriginNotAllowedError({ origin }))
    }
  })
```

### 8.3 Rate Limiting

```typescript
class RateLimiter {
  private buckets = new Map<string, TokenBucket>()
  
  checkRateLimit(
    key: string,
    maxRequests: number,
    windowMs: number
  ): Effect.Effect<boolean> {
    return Effect.gen(function* () {
      let bucket = this.buckets.get(key)
      
      if (!bucket) {
        bucket = new TokenBucket({
          capacity: maxRequests,
          refillRate: maxRequests / (windowMs / 1000),
          tokens: maxRequests
        })
        this.buckets.set(key, bucket)
      }
      
      const result = bucket.consume(1)
      
      if (!result.allowed) {
        yield* securityService.logSecurityEvent({
          type: "RATE_LIMIT_EXCEEDED",
          key,
          retryAfter: result.retryAfter
        })
      }
      
      return result.allowed
    })
  }
}

// Per-endpoint rate limits
const RATE_LIMITS = {
  "chat": { maxRequests: 10, windowMs: 10000 },
  "skill_activate": { maxRequests: 5, windowMs: 1000 },
  "trade": { maxRequests: 5, windowMs: 60000 },
  "movement": { maxRequests: 20, windowMs: 1000 },
  "connection": { maxRequests: 5, windowMs: 60000 }
}
```

### 8.4 DDoS Protection

```
┌─────────────────────────────────────────────────────────────────┐
│                    DDoS PROTECTION LAYERS                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│    Layer 1: Cloudflare (Edge)                                   │
│    ├── DDoS mitigation                                          │
│    ├── Bot detection                                            │
│    ├── Rate limiting at edge                                    │
│    └── WAF rules                                                │
│                                                                  │
│    Layer 2: Load Balancer (NGINX)                               │
│    ├── Connection limiting                                      │
│    ├── Request rate limiting                                    │
│    └── SSL termination                                          │
│                                                                  │
│    Layer 3: Application (Bun)                                   │
│    ├── WebSocket rate limiting                                  │
│    ├── Message size limits                                      │
│    └── Connection timeout                                       │
│                                                                  │
│    Layer 4: Database (PostgreSQL/Redis)                         │
│    ├── Connection pooling                                       │
│    ├── Query rate limiting                                      │
│    └── Circuit breakers                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Data Security

### 9.1 Data Encryption

```typescript
// Encryption at rest (database)
const encryptSensitiveData = (data: string): string => {
  const cipher = crypto.createCipheriv(
    "aes-256-gcm",
    config.encryptionKey,
    config.encryptionIV
  )
  let encrypted = cipher.update(data, "utf8", "hex")
  encrypted += cipher.final("hex")
  const authTag = cipher.getAuthTag()
  return `${encrypted}:${authTag.toString("hex")}`
}

const decryptSensitiveData = (encrypted: string): string => {
  const [data, authTagHex] = encrypted.split(":")
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    config.encryptionKey,
    config.encryptionIV
  )
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"))
  let decrypted = decipher.update(data, "hex", "utf8")
  decrypted += decipher.final("utf8")
  return decrypted
}

// Fields to encrypt
const SENSITIVE_FIELDS = [
  "email",
  "ip_address",
  "chat_message"  // For privacy compliance
]
```

### 9.2 Password Security

```typescript
import { hash, verify } from "argon2"

const hashPassword = async (password: string): Promise<string> => {
  return await hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,  // 64 MB
    timeCost: 3,
    parallelism: 4,
    hashLength: 32
  })
}

const verifyPassword = async (hash: string, password: string): Promise<boolean> => {
  try {
    return await verify(hash, password)
  } catch {
    return false
  }
}

// Password requirements
const validatePasswordStrength = (password: string): Effect.Effect<void> => {
  return Effect.gen(function* () {
    if (password.length < 12) {
      return yield* Effect.fail(new WeakPasswordError({ reason: "Too short" }))
    }
    if (!/[A-Z]/.test(password)) {
      return yield* Effect.fail(new WeakPasswordError({ reason: "Missing uppercase" }))
    }
    if (!/[a-z]/.test(password)) {
      return yield* Effect.fail(new WeakPasswordError({ reason: "Missing lowercase" }))
    }
    if (!/[0-9]/.test(password)) {
      return yield* Effect.fail(new WeakPasswordError({ reason: "Missing number" }))
    }
    if (!/[!@#$%^&*]/.test(password)) {
      return yield* Effect.fail(new WeakPasswordError({ reason: "Missing special character" }))
    }
  })
}
```

---

## 10. Incident Response

### 10.1 Security Event Classification

| Severity | Type | Response Time |
|----------|------|---------------|
| **Critical** | Data breach, economy exploit | Immediate |
| **High** | Speed hack, teleportation | < 1 minute |
| **Medium** | Botting, suspicious trade | < 1 hour |
| **Low** | Chat violation, minor exploit | < 24 hours |

### 10.2 Automated Response

```typescript
class IncidentResponse {
  async handleSecurityEvent(event: SecurityEvent): Promise<void> {
    switch (event.severity) {
      case "CRITICAL":
        await this.criticalResponse(event)
        break
      case "HIGH":
        await this.highResponse(event)
        break
      case "MEDIUM":
        await this.mediumResponse(event)
        break
      default:
        await this.logEvent(event)
    }
  }
  
  private async criticalResponse(event: SecurityEvent): Promise<void> {
    // 1. Log to security system
    await this.logToSecuritySystem(event)
    
    // 2. Alert on-call team
    await this.alertTeam(event)
    
    // 3. Consider server lockdown
    if (event.type === "ECONOMY_EXPLOIT") {
      await this.freezeEconomy()
    }
    
    // 4. Ban offending account
    await this.banAccount(event.playerId, event.type)
  }
  
  private async highResponse(event: SecurityEvent): Promise<void> {
    // 1. Increment violation counter
    const violations = await this.incrementViolations(event.playerId)
    
    // 2. Auto-action based on violation count
    if (violations >= 5) {
      await this.temporaryBan(event.playerId, 1) // 1 hour
    } else if (violations >= 10) {
      await this.temporaryBan(event.playerId, 24) // 24 hours
    }
    
    // 3. Rollback suspicious actions
    if (event.type === "TELEPORTATION") {
      await this.rollbackPosition(event.playerId)
    }
  }
}
```

---

## 11. Security Checklist

### Pre-Launch Checklist

- [ ] **Authentication**
  - [ ] JWT with strong secret (256+ bits)
  - [ ] Token expiration < 1 hour
  - [ ] Token revocation implemented
  - [ ] Rate limiting on login attempts
  - [ ] Password requirements enforced

- [ ] **Authorization**
  - [ ] RBAC implemented
  - [ ] Permission checks on all admin actions
  - [ ] Session validation on every request

- [ ] **Input Validation**
  - [ ] All messages validated against schema
  - [ ] Type checking enforced
  - [ ] Range validation on all numeric inputs
  - [ ] SQL injection prevention (parameterized queries)

- [ ] **Anti-Cheat**
  - [ ] Speed hack detection active
  - [ ] Teleportation detection active
  - [ ] Range validation on combat
  - [ ] Cooldown enforcement server-side
  - [ ] Resource validation (MP, HP)

- [ ] **Economy Security**
  - [ ] Atomic transactions
  - [ ] Inventory locks during trades
  - [ ] Transaction logging
  - [ ] Unfair trade detection

- [ ] **Network Security**
  - [ ] WSS enforced in production
  - [ ] Origin validation (CSWSH)
  - [ ] Rate limiting configured
  - [ ] DDoS protection active
  - [ ] Message size limits

- [ ] **Data Security**
  - [ ] Passwords hashed with Argon2
  - [ ] Sensitive data encrypted at rest
  - [ ] Database access restricted
  - [ ] Backups encrypted

- [ ] **Monitoring**
  - [ ] Security events logged
  - [ ] Alerting configured
  - [ ] Audit trail for sensitive operations

---

**Document Version:** 1.0.0  
**Last Updated:** February 2026  
**Owner:** Security Team
