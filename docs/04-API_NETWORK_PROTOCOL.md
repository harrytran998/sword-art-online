# Sword Art Online: Aincrad Online
## API & Network Protocol Document

**Version:** 1.0.0  
**Date:** February 2026  
**Status:** Planning Phase

---

## Table of Contents

1. [Protocol Overview](#1-protocol-overview)
2. [WebSocket Connection](#2-websocket-connection)
3. [Message Format](#3-message-format)
4. [Client → Server Messages](#4-client--server-messages)
5. [Server → Client Messages](#5-server--client-messages)
6. [Binary Protocol (Optional)](#6-binary-protocol-optional)
7. [Error Handling](#7-error-handling)
8. [Rate Limiting](#8-rate-limiting)
9. [Heartbeat & Connection Management](#9-heartbeat--connection-management)

---

## 1. Protocol Overview

### 1.1 Communication Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMMUNICATION STACK                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│    ┌─────────────────────────────────────────────────────┐      │
│    │              Application Layer (Game API)            │      │
│    │  • Movement, Combat, Inventory, Social               │      │
│    └────────────────────────┬────────────────────────────┘      │
│                             │                                    │
│    ┌────────────────────────▼────────────────────────────┐      │
│    │              Serialization Layer (JSON/MessagePack)  │      │
│    │  • Type-safe encoding/decoding                       │      │
│    └────────────────────────┬────────────────────────────┘      │
│                             │                                    │
│    ┌────────────────────────▼────────────────────────────┐      │
│    │              Transport Layer (WebSocket)             │      │
│    │  • WSS (TLS encrypted)                               │      │
│    │  • Bun native WebSocket                              │      │
│    └────────────────────────┬────────────────────────────┘      │
│                             │                                    │
│    ┌────────────────────────▼────────────────────────────┐      │
│    │              Network Layer (TCP/IP)                  │      │
│    │  • Cloudflare CDN / Direct connection               │      │
│    └─────────────────────────────────────────────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Design Principles

| Principle | Description |
|-----------|-------------|
| **Server-Authoritative** | Client sends inputs, server sends state |
| **Type-Safe** | All messages validated against schemas |
| **Minimal Payload** | Only necessary data transmitted |
| **Delta Compression** | Only changed state sent |
| **Predictable Latency** | Heartbeat for connection health |

---

## 2. WebSocket Connection

### 2.1 Connection URL

```
wss://game.aincrad-online.com/ws?token={jwt_token}&version={client_version}
```

### 2.2 Connection Flow

```
┌──────────┐                                    ┌──────────┐
│  Client  │                                    │  Server  │
└────┬─────┘                                    └────┬─────┘
     │                                                │
     │  1. WebSocket Upgrade Request                 │
     │    GET /ws?token=xxx&version=1.0.0            │
     │    Origin: https://aincrad-online.com         │
     │──────────────────────────────────────────────▶│
     │                                                │
     │                    2. Validate Token          │
     │                       Validate Origin         │
     │                       Check Rate Limits       │
     │                                                │
     │  3. 101 Switching Protocols                   │
     │    Connection Established                     │
     │◀──────────────────────────────────────────────│
     │                                                │
     │  4. { type: "connection_ready", ... }         │
     │◀──────────────────────────────────────────────│
     │                                                │
     │  5. { type: "heartbeat", ts: 1234567890 }     │
     │──────────────────────────────────────────────▶│
     │                                                │
     │  6. { type: "heartbeat_ack", ts: 1234567891 } │
     │◀──────────────────────────────────────────────│
     │                                                │
     │              Game Messages...                  │
     │◀──────────────────────────────────────────────▶│
     │                                                │
```

### 2.3 Authentication

```typescript
// Token validation on upgrade
const validateConnection = (request: Request): Effect.Effect<PlayerData, AuthError> =>
  Effect.gen(function* () {
    const url = new URL(request.url)
    const token = url.searchParams.get("token")
    const clientVersion = url.searchParams.get("version")
    
    // 1. Validate origin (CSWSH protection)
    const origin = request.headers.get("origin")
    const allowedOrigins = ["https://aincrad-online.com", "https://www.aincrad-online.com"]
    if (!origin || !allowedOrigins.includes(origin)) {
      return yield* Effect.fail(new OriginNotAllowedError({ origin }))
    }
    
    // 2. Validate JWT
    const decoded = yield* verifyJWT(token)
    
    // 3. Check token not revoked
    const isRevoked = yield* cacheService.get(`revoked:${decoded.jti}`)
    if (isRevoked) {
      return yield* Effect.fail(new TokenRevokedError())
    }
    
    // 4. Get player data
    const player = yield* playerService.getPlayer(decoded.playerId)
    
    // 5. Check already connected (single session)
    const existingSession = yield* cacheService.get(`session:${player.id}`)
    if (existingSession) {
      // Disconnect existing session
      yield* disconnectPlayer(player.id)
    }
    
    return {
      playerId: player.id,
      characterId: player.characterId,
      sessionToken: decoded.jti,
      position: player.position,
      connectedAt: Date.now()
    }
  })
```

---

## 3. Message Format

### 3.1 JSON Message Structure

```typescript
// Base message structure
interface BaseMessage {
  type: string
  timestamp: number
  sequence?: number  // For client messages
}

// All messages extend BaseMessage
type GameMessage = ClientMessage | ServerMessage
```

### 3.2 Type Definitions

```typescript
// types/messages.ts

// ============================================
// ENUMS
// ============================================

type Direction = "north" | "south" | "east" | "west" | "up" | "down"

type ChatChannel = "world" | "floor" | "zone" | "party" | "guild" | "whisper" | "trade"

type EquipmentSlot = 
  | "main_hand" 
  | "off_hand" 
  | "head" 
  | "chest" 
  | "hands" 
  | "legs" 
  | "feet" 
  | "accessory_1" 
  | "accessory_2" 
  | "accessory_3"

type ErrorCode =
  | "INVALID_MESSAGE"
  | "INVALID_TOKEN"
  | "TOKEN_EXPIRED"
  | "RATE_LIMITED"
  | "PLAYER_NOT_FOUND"
  | "INVALID_POSITION"
  | "SKILL_ON_COOLDOWN"
  | "INSUFFICIENT_MP"
  | "TARGET_OUT_OF_RANGE"
  | "ITEM_NOT_FOUND"
  | "INVENTORY_FULL"
  | "INSUFFICIENT_COL"
  | "PERMISSION_DENIED"
  | "SERVER_ERROR"

// ============================================
// POSITION & MOVEMENT
// ============================================

interface Position {
  x: number
  y: number
  z: number
  floorId: number
  zoneId: string
}

interface Velocity {
  x: number
  y: number
  z: number
}

// ============================================
// ENTITY REFERENCES
// ============================================

interface EntityReference {
  id: string
  type: "player" | "monster" | "npc" | "item"
}

interface EntityUpdate {
  id: string
  type: "player" | "monster" | "npc"
  position: Position
  velocity?: Velocity
  hp: number
  maxHp: number
  animationState?: string
  effects?: StatusEffect[]
}
```

---

## 4. Client → Server Messages

### 4.1 Movement Messages

```typescript
// Start moving in a direction
interface MovementStartMessage {
  type: "movement_start"
  direction: Direction
  timestamp: number
  sequence: number
}

// Stop moving
interface MovementStopMessage {
  type: "movement_stop"
  timestamp: number
  sequence: number
}

// Position update (for reconciliation)
interface PositionUpdateMessage {
  type: "position_update"
  position: Position
  velocity: Velocity
  timestamp: number
  sequence: number
}

// Zone change notification
interface ZoneChangeMessage {
  type: "zone_change"
  fromZoneId: string
  toZoneId: string
  timestamp: number
}
```

### 4.2 Combat Messages

```typescript
// Activate a skill
interface SkillActivateMessage {
  type: "skill_activate"
  skillId: number
  targetId?: string  // Optional for directional skills
  targetPosition?: Position  // For AoE skills
  timestamp: number
  sequence: number
}

// Cancel skill (during pre-motion)
interface SkillCancelMessage {
  type: "skill_cancel"
  skillId: number
  timestamp: number
}

// Auto-attack
interface AutoAttackMessage {
  type: "auto_attack"
  targetId: string
  timestamp: number
  sequence: number
}

// Use consumable
interface ItemUseMessage {
  type: "item_use"
  itemId: string  // Inventory item ID
  targetId?: string  // For targeted consumables
  timestamp: number
}
```

### 4.3 Inventory Messages

```typescript
// Equip item
interface ItemEquipMessage {
  type: "item_equip"
  itemId: string
  slot: EquipmentSlot
  timestamp: number
}

// Unequip item
interface ItemUnequipMessage {
  type: "item_unequip"
  slot: EquipmentSlot
  timestamp: number
}

// Move item in inventory
interface ItemMoveMessage {
  type: "item_move"
  itemId: string
  fromSlot: number
  toSlot: number
  timestamp: number
}

// Drop item
interface ItemDropMessage {
  type: "item_drop"
  itemId: string
  quantity: number
  timestamp: number
}

// Pick up item
interface ItemPickupMessage {
  type: "item_pickup"
  worldItemId: string  // ID of item on ground
  timestamp: number
}

// Sell item to NPC
interface ItemSellMessage {
  type: "item_sell"
  npcId: string
  itemId: string
  quantity: number
  timestamp: number
}

// Buy item from NPC
interface ItemBuyMessage {
  type: "item_buy"
  npcId: string
  itemDefinitionId: number
  quantity: number
  timestamp: number
}
```

### 4.4 Social Messages

```typescript
// Chat message
interface ChatMessage {
  type: "chat"
  channel: ChatChannel
  recipientId?: string  // For whispers
  message: string
  timestamp: number
}

// Friend request
interface FriendRequestMessage {
  type: "friend_request"
  targetPlayerId: string
  timestamp: number
}

// Friend request response
interface FriendResponseMessage {
  type: "friend_response"
  requesterId: string
  accept: boolean
  timestamp: number
}

// Friend remove
interface FriendRemoveMessage {
  type: "friend_remove"
  friendId: string
  timestamp: number
}

// Party invite
interface PartyInviteMessage {
  type: "party_invite"
  targetPlayerId: string
  timestamp: number
}

// Party response
interface PartyResponseMessage {
  type: "party_response"
  partyId: string
  accept: boolean
  timestamp: number
}

// Party leave
interface PartyLeaveMessage {
  type: "party_leave"
  timestamp: number
}

// Guild create
interface GuildCreateMessage {
  type: "guild_create"
  name: string
  tag: string
  timestamp: number
}

// Guild invite
interface GuildInviteMessage {
  type: "guild_invite"
  targetPlayerId: string
  timestamp: number
}

// Guild response
interface GuildResponseMessage {
  type: "guild_response"
  guildId: string
  accept: boolean
  timestamp: number
}

// Guild leave
interface GuildLeaveMessage {
  type: "guild_leave"
  timestamp: number
}
```

### 4.5 Trade Messages

```typescript
// Trade request
interface TradeRequestMessage {
  type: "trade_request"
  targetPlayerId: string
  timestamp: number
}

// Trade response
interface TradeResponseMessage {
  type: "trade_response"
  tradeId: string
  accept: boolean
  timestamp: number
}

// Add item to trade
interface TradeAddItemMessage {
  type: "trade_add_item"
  tradeId: string
  itemId: string
  quantity: number
  timestamp: number
}

// Add col to trade
interface TradeAddColMessage {
  type: "trade_add_col"
  tradeId: string
  amount: number
  timestamp: number
}

// Confirm trade
interface TradeConfirmMessage {
  type: "trade_confirm"
  tradeId: string
  timestamp: number
}

// Cancel trade
interface TradeCancelMessage {
  type: "trade_cancel"
  tradeId: string
  timestamp: number
}
```

### 4.6 System Messages

```typescript
// Heartbeat
interface HeartbeatMessage {
  type: "heartbeat"
  timestamp: number
}

// Acknowledge server message
interface AcknowledgeMessage {
  type: "ack"
  messageIds: string[]
  timestamp: number
}

// Request initial state
interface RequestStateMessage {
  type: "request_state"
  timestamp: number
}

// Client info
interface ClientInfoMessage {
  type: "client_info"
  version: string
  platform: string
  screenResolution: { width: number; height: number }
  timestamp: number
}
```

---

## 5. Server → Client Messages

### 5.1 Connection Messages

```typescript
// Connection established
interface ConnectionReadyMessage {
  type: "connection_ready"
  playerId: string
  character: CharacterData
  serverTime: number
  tickRate: number
  config: GameConfig
}

// Disconnected
interface DisconnectedMessage {
  type: "disconnected"
  reason: string
  canReconnect: boolean
  reconnectToken?: string
}

// Server maintenance
interface MaintenanceMessage {
  type: "maintenance"
  message: string
  startTime: number
  duration: number
}
```

### 5.2 State Update Messages

```typescript
// Full state sync (on connect/zone change)
interface FullStateMessage {
  type: "full_state"
  player: PlayerState
  nearbyPlayers: PlayerState[]
  nearbyMonsters: MonsterState[]
  nearbyNpcs: NpcState[]
  droppedItems: DroppedItem[]
  timestamp: number
  tick: number
}

// Delta state update (regular tick)
interface StateUpdateMessage {
  type: "state_update"
  updates: EntityUpdate[]
  removed: string[]  // IDs of removed entities
  timestamp: number
  tick: number
}

// Zone changed
interface ZoneChangedMessage {
  type: "zone_changed"
  zoneId: string
  floorId: number
  zoneName: string
  nearbyEntities: EntityState[]
  timestamp: number
}
```

### 5.3 Player Messages

```typescript
// Player joined zone
interface PlayerJoinedMessage {
  type: "player_joined"
  player: PlayerState
  timestamp: number
}

// Player left zone
interface PlayerLeftMessage {
  type: "player_left"
  playerId: string
  reason: string
  timestamp: number
}

// Player moved
interface PlayerMovedMessage {
  type: "player_moved"
  playerId: string
  position: Position
  velocity: Velocity
  animationState: string
  timestamp: number
  tick: number
}

// Player stats changed
interface PlayerStatsChangedMessage {
  type: "player_stats_changed"
  playerId: string
  stats: Partial<PlayerStats>
  timestamp: number
}

// Level up
interface LevelUpMessage {
  type: "level_up"
  playerId: string
  newLevel: number
  unallocatedPoints: number
  timestamp: number
}
```

### 5.4 Combat Messages

```typescript
// Skill executed
interface SkillExecutedMessage {
  type: "skill_executed"
  playerId: string
  skillId: number
  skillName: string
  targets: SkillTarget[]
  timestamp: number
  tick: number
}

interface SkillTarget {
  targetId: string
  damage?: number
  heal?: number
  effects?: StatusEffect[]
  hit: boolean
  critical?: boolean
}

// Damage dealt
interface DamageDealtMessage {
  type: "damage_dealt"
  sourceId: string
  targetType: "player" | "monster"
  targetId: string
  amount: number
  damageType: "physical" | "magic" | "true"
  isCritical: boolean
  timestamp: number
}

// Healing received
interface HealingReceivedMessage {
  type: "healing_received"
  sourceId: string
  targetId: string
  amount: number
  timestamp: number
}

// Status effect applied
interface StatusEffectAppliedMessage {
  type: "status_effect_applied"
  targetId: string
  effect: StatusEffect
  duration: number
  timestamp: number
}

// Status effect removed
interface StatusEffectRemovedMessage {
  type: "status_effect_removed"
  targetId: string
  effectId: string
  timestamp: number
}

// Monster spawned
interface MonsterSpawnedMessage {
  type: "monster_spawned"
  monster: MonsterState
  timestamp: number
}

// Monster killed
interface MonsterKilledMessage {
  type: "monster_killed"
  monsterId: string
  killerId: string
  loot: LootDrop[]
  experience: number
  timestamp: number
}

interface LootDrop {
  worldItemId: string
  itemDefinitionId: number
  itemName: string
  quantity: number
  position: Position
}

// Player died
interface PlayerDiedMessage {
  type: "player_died"
  playerId: string
  killerId?: string
  killerType?: "player" | "monster" | "environment"
  respawnTime: number
  timestamp: number
}

// Player respawned
interface PlayerRespawnedMessage {
  type: "player_respawned"
  playerId: string
  position: Position
  hp: number
  mp: number
  timestamp: number
}
```

### 5.5 Inventory Messages

```typescript
// Inventory updated
interface InventoryUpdatedMessage {
  type: "inventory_updated"
  items: InventoryItem[]
  timestamp: number
}

// Equipment updated
interface EquipmentUpdatedMessage {
  type: "equipment_updated"
  equipment: EquipmentSlot[]
  stats: PlayerStats
  timestamp: number
}

// Item dropped (on ground)
interface ItemDroppedMessage {
  type: "item_dropped"
  worldItem: DroppedItem
  timestamp: number
}

// Item picked up
interface ItemPickedUpMessage {
  type: "item_picked_up"
  worldItemId: string
  playerId: string
  item: InventoryItem
  timestamp: number
}

// Col changed
interface ColChangedMessage {
  type: "col_changed"
  newAmount: number
  change: number
  reason: string
  timestamp: number
}
```

### 5.6 Social Messages

```typescript
// Chat message received
interface ChatReceivedMessage {
  type: "chat_received"
  channel: ChatChannel
  senderId: string
  senderName: string
  message: string
  timestamp: number
}

// Friend list
interface FriendListMessage {
  type: "friend_list"
  friends: Friend[]
  timestamp: number
}

interface Friend {
  id: string
  name: string
  level: number
  classId: number
  online: boolean
  floorId?: number
  zoneId?: string
}

// Friend request received
interface FriendRequestReceivedMessage {
  type: "friend_request_received"
  requesterId: string
  requesterName: string
  timestamp: number
}

// Friend status changed
interface FriendStatusChangedMessage {
  type: "friend_status_changed"
  friendId: string
  online: boolean
  floorId?: number
  zoneId?: string
  timestamp: number
}

// Party created
interface PartyCreatedMessage {
  type: "party_created"
  partyId: string
  members: PartyMember[]
  timestamp: number
}

// Party updated
interface PartyUpdatedMessage {
  type: "party_updated"
  members: PartyMember[]
  leaderId: string
  timestamp: number
}

// Party invite received
interface PartyInviteReceivedMessage {
  type: "party_invite_received"
  partyId: string
  inviterId: string
  inviterName: string
  timestamp: number
}

// Party disbanded
interface PartyDisbandedMessage {
  type: "party_disbanded"
  reason: string
  timestamp: number
}

// Guild info
interface GuildInfoMessage {
  type: "guild_info"
  guild: GuildData
  members: GuildMember[]
  timestamp: number
}

// Guild invite received
interface GuildInviteReceivedMessage {
  type: "guild_invite_received"
  guildId: string
  guildName: string
  inviterId: string
  inviterName: string
  timestamp: number
}
```

### 5.7 Trade Messages

```typescript
// Trade request received
interface TradeRequestReceivedMessage {
  type: "trade_request_received"
  tradeId: string
  requesterId: string
  requesterName: string
  timestamp: number
}

// Trade started
interface TradeStartedMessage {
  type: "trade_started"
  tradeId: string
  partnerId: string
  partnerName: string
  timestamp: number
}

// Trade updated (partner added items)
interface TradeUpdatedMessage {
  type: "trade_updated"
  tradeId: string
  playerAItems: TradeItem[]
  playerACol: number
  playerBItems: TradeItem[]
  playerBCol: number
  timestamp: number
}

interface TradeItem {
  itemId: string
  itemDefinitionId: number
  itemName: string
  quantity: number
  enhancementLevel: number
}

// Trade completed
interface TradeCompletedMessage {
  type: "trade_completed"
  tradeId: string
  receivedItems: InventoryItem[]
  receivedCol: number
  timestamp: number
}

// Trade cancelled
interface TradeCancelledMessage {
  type: "trade_cancelled"
  tradeId: string
  reason: string
  timestamp: number
}
```

### 5.8 System Messages

```typescript
// Heartbeat acknowledgment
interface HeartbeatAckMessage {
  type: "heartbeat_ack"
  serverTime: number
  clientTime: number  // Echo back client's timestamp
}

// Error message
interface ErrorMessage {
  type: "error"
  code: ErrorCode
  message: string
  details?: Record<string, unknown>
  timestamp: number
}

// Notification
interface NotificationMessage {
  type: "notification"
  category: "info" | "success" | "warning" | "error"
  title: string
  message: string
  duration: number
  timestamp: number
}

// Quest update
interface QuestUpdateMessage {
  type: "quest_update"
  questId: number
  questName: string
  status: "started" | "progress" | "completed"
  objectives: QuestObjective[]
  timestamp: number
}

// Achievement unlocked
interface AchievementUnlockedMessage {
  type: "achievement_unlocked"
  achievementId: number
  achievementName: string
  description: string
  rewards: AchievementReward[]
  timestamp: number
}

// Floor boss status
interface FloorBossStatusMessage {
  type: "floor_boss_status"
  floorId: number
  bossName: string
  status: "alive" | "in_combat" | "defeated"
  currentHp?: number
  maxHp?: number
  timestamp: number
}

// Announcement
interface AnnouncementMessage {
  type: "announcement"
  title: string
  message: string
  priority: "low" | "medium" | "high" | "critical"
  timestamp: number
}
```

---

## 6. Binary Protocol (Optional)

### 6.1 When to Use Binary

| Scenario | Recommended Protocol |
|----------|---------------------|
| Chat messages | JSON |
| Inventory operations | JSON |
| State updates (60Hz) | **Binary** |
| Combat events | JSON |
| Position updates | **Binary** |

### 6.2 Binary Message Header

```
┌────────────────────────────────────────────────────────────┐
│                    BINARY MESSAGE FORMAT                    │
├────────┬─────────┬─────────┬───────────────────────────────┤
│ Bytes  │ 0-1     │ 2-3     │ 4+                            │
│ Field  │ Type ID │ Length  │ Payload                       │
│ Size   │ 2 bytes │ 2 bytes │ Variable                      │
└────────┴─────────┴─────────┴───────────────────────────────┘
```

### 6.3 Position Update (Binary)

```typescript
// Type ID: 0x0001
interface BinaryPositionUpdate {
  typeId: 0x0001  // 2 bytes
  length: number  // 2 bytes (total message length)
  
  // Payload:
  playerId: string    // 16 bytes (UUID)
  tick: number        // 4 bytes (uint32)
  x: number           // 4 bytes (float32)
  y: number           // 4 bytes (float32)
  z: number           // 4 bytes (float32)
  vx: number          // 2 bytes (int16, scaled)
  vy: number          // 2 bytes (int16, scaled)
  vz: number          // 2 bytes (int16, scaled)
  rotation: number    // 2 bytes (uint16, degrees * 100)
  animationState: number // 1 byte (enum)
}

// Total: 43 bytes vs ~200 bytes JSON
```

### 6.4 Binary Encoding/Decoding

```typescript
// Binary encoder for position updates
const encodePositionUpdate = (update: PositionUpdate): Buffer => {
  const buffer = Buffer.alloc(43)
  let offset = 0
  
  // Header
  buffer.writeUInt16BE(0x0001, offset) // Type ID
  offset += 2
  buffer.writeUInt16BE(43, offset)     // Length
  offset += 2
  
  // Payload
  buffer.write(update.playerId, offset, 16, 'hex') // UUID
  offset += 16
  buffer.writeUInt32BE(update.tick, offset)
  offset += 4
  buffer.writeFloatBE(update.x, offset)
  offset += 4
  buffer.writeFloatBE(update.y, offset)
  offset += 4
  buffer.writeFloatBE(update.z, offset)
  offset += 4
  buffer.writeInt16BE(Math.round(update.vx * 100), offset)
  offset += 2
  buffer.writeInt16BE(Math.round(update.vy * 100), offset)
  offset += 2
  buffer.writeInt16BE(Math.round(update.vz * 100), offset)
  offset += 2
  buffer.writeUInt16BE(Math.round(update.rotation * 100), offset)
  offset += 2
  buffer.writeUInt8(update.animationState, offset)
  
  return buffer
}

// Binary decoder
const decodePositionUpdate = (buffer: Buffer): PositionUpdate => {
  let offset = 4 // Skip header
  
  return {
    playerId: buffer.toString('hex', offset, offset + 16),
    tick: buffer.readUInt32BE(offset + 16),
    x: buffer.readFloatBE(offset + 20),
    y: buffer.readFloatBE(offset + 24),
    z: buffer.readFloatBE(offset + 28),
    vx: buffer.readInt16BE(offset + 32) / 100,
    vy: buffer.readInt16BE(offset + 34) / 100,
    vz: buffer.readInt16BE(offset + 36) / 100,
    rotation: buffer.readUInt16BE(offset + 38) / 100,
    animationState: buffer.readUInt8(offset + 40)
  }
}
```

---

## 7. Error Handling

### 7.1 Error Response Format

```typescript
interface ErrorResponse {
  type: "error"
  code: ErrorCode
  message: string
  details?: Record<string, unknown>
  originalMessageId?: string  // Reference to failed message
  timestamp: number
}
```

### 7.2 Error Codes

| Code | Description | Client Action |
|------|-------------|---------------|
| `INVALID_MESSAGE` | Malformed JSON or invalid schema | Log and ignore |
| `INVALID_TOKEN` | JWT validation failed | Re-login required |
| `TOKEN_EXPIRED` | JWT has expired | Refresh token |
| `RATE_LIMITED` | Too many messages | Backoff and retry |
| `PLAYER_NOT_FOUND` | Player doesn't exist | Refresh state |
| `INVALID_POSITION` | Position validation failed | Reconcile to server |
| `SKILL_ON_COOLDOWN` | Skill not ready | Update UI |
| `INSUFFICIENT_MP` | Not enough MP | Update UI |
| `TARGET_OUT_OF_RANGE` | Target too far | Update position |
| `ITEM_NOT_FOUND` | Item doesn't exist | Refresh inventory |
| `INVENTORY_FULL` | No space in inventory | Show notification |
| `INSUFFICIENT_COL` | Not enough currency | Show notification |
| `PERMISSION_DENIED` | Action not allowed | Show error |
| `SERVER_ERROR` | Internal server error | Retry later |

### 7.3 Error Handling Example

```typescript
// Server-side error handling
const handleMessage = (playerId: string, message: unknown) =>
  Effect.gen(function* () {
    // Validate message structure
    const parsed = yield* parseMessage(message).pipe(
      Effect.catchAll((error) =>
        Effect.fail(new InvalidMessageError({ reason: error.message }))
      )
    )
    
    // Route to handler
    const result = yield* routeMessage(playerId, parsed).pipe(
      Effect.catchTags({
        PlayerNotFoundError: (error) =>
          Effect.succeed({
            type: "error" as const,
            code: "PLAYER_NOT_FOUND" as const,
            message: "Player not found",
            originalMessageId: parsed.id
          }),
        InvalidPositionError: (error) =>
          Effect.succeed({
            type: "error" as const,
            code: "INVALID_POSITION" as const,
            message: error.reason,
            details: { position: error.position }
          }),
        SkillCooldownError: (error) =>
          Effect.succeed({
            type: "error" as const,
            code: "SKILL_ON_COOLDOWN" as const,
            message: `Skill on cooldown for ${error.remainingMs}ms`,
            details: { skillId: error.skillId, remainingMs: error.remainingMs }
          })
      })
    )
    
    return result
  })
```

---

## 8. Rate Limiting

### 8.1 Rate Limits

| Message Type | Limit | Window |
|--------------|-------|--------|
| `chat` | 10 messages | 10 seconds |
| `movement_start` | 20 | 1 second |
| `skill_activate` | 5 | 1 second |
| `trade_request` | 5 | 60 seconds |
| `friend_request` | 10 | 60 seconds |
| `heartbeat` | 2 | 5 seconds |
| All messages | 100 | 1 second |

### 8.2 Token Bucket Implementation

```typescript
class RateLimiter {
  private buckets = new Map<string, TokenBucket>()
  
  check(playerId: string, messageType: string): Effect.Effect<boolean> {
    const key = `${playerId}:${messageType}`
    const config = RATE_LIMIT_CONFIG[messageType] || DEFAULT_CONFIG
    
    let bucket = this.buckets.get(key)
    if (!bucket) {
      bucket = new TokenBucket(config.capacity, config.refillRate)
      this.buckets.set(key, bucket)
    }
    
    return Effect.succeed(bucket.consume())
  }
}

// Usage
const handleChatMessage = (playerId: string, message: ChatMessage) =>
  Effect.gen(function* () {
    const rateLimiter = yield* RateLimiterService
    
    const allowed = yield* rateLimiter.check(playerId, "chat")
    if (!allowed) {
      return yield* Effect.fail(new RateLimitedError({ 
        playerId, 
        messageType: "chat" 
      }))
    }
    
    // Process message
    yield* chatService.sendMessage(playerId, message)
  })
```

---

## 9. Heartbeat & Connection Management

### 9.1 Heartbeat Protocol

```
Client                              Server
  │                                   │
  │  heartbeat { ts: 1000 }          │
  │──────────────────────────────────▶│
  │                                   │
  │  heartbeat_ack {                  │
  │    serverTime: 1005,              │
  │    clientTime: 1000               │
  │  }                                │
  │◀──────────────────────────────────│
  │                                   │
  │  [10 seconds later]               │
  │                                   │
  │  heartbeat { ts: 2010 }          │
  │──────────────────────────────────▶│
  │                                   │
```

### 9.2 Connection Timeout

```typescript
const HEARTBEAT_INTERVAL = 10000  // 10 seconds
const HEARTBEAT_TIMEOUT = 30000   // 30 seconds

const connectionMonitor = (ws: ServerWebSocket) =>
  Effect.gen(function* () {
    let lastHeartbeat = Date.now()
    
    // Check for dead connections
    const checkInterval = setInterval(() => {
      const elapsed = Date.now() - lastHeartbeat
      if (elapsed > HEARTBEAT_TIMEOUT) {
        ws.close(1001, "Connection timeout")
        clearInterval(checkInterval)
      }
    }, HEARTBEAT_INTERVAL)
    
    // Handle heartbeat
    ws.on("message", (data) => {
      const message = JSON.parse(data.toString())
      if (message.type === "heartbeat") {
        lastHeartbeat = Date.now()
        ws.send(JSON.stringify({
          type: "heartbeat_ack",
          serverTime: Date.now(),
          clientTime: message.timestamp
        }))
      }
    })
    
    ws.on("close", () => {
      clearInterval(checkInterval)
    })
  })
```

### 9.3 Reconnection

```typescript
// Client reconnection flow
interface ReconnectToken {
  playerId: string
  sessionId: string
  lastTick: number
  expiresAt: number
}

const handleReconnection = (token: ReconnectToken) =>
  Effect.gen(function* () {
    // 1. Validate token
    if (Date.now() > token.expiresAt) {
      return yield* Effect.fail(new TokenExpiredError())
    }
    
    // 2. Get player state
    const player = yield* playerService.getPlayer(token.playerId)
    
    // 3. Send state since last tick
    const missedUpdates = yield* stateService.getUpdatesSince(token.lastTick)
    
    // 4. Return reconnect response
    return {
      type: "reconnected",
      player,
      missedUpdates,
      serverTime: Date.now()
    }
  })
```

---

## Appendix A: Message Type Registry

| Type ID | Message Type | Direction |
|---------|-------------|-----------|
| 0x0001 | position_update | C→S |
| 0x0002 | state_update | S→C |
| 0x0003 | skill_activate | C→S |
| 0x0004 | skill_executed | S→C |
| 0x0005 | chat | C→S |
| 0x0006 | chat_received | S→C |
| 0x0007 | heartbeat | C→S |
| 0x0008 | heartbeat_ack | S→C |
| 0x0009 | error | S→C |
| 0x000A | connection_ready | S→C |

---

**Document Version:** 1.0.0  
**Last Updated:** February 2026  
**Owner:** API Team
