/**
 * WebSocket message types shared between server and client.
 * These define the communication protocol.
 */

// ============================================================
// Client → Server messages
// ============================================================

export interface MovementMessage {
  readonly _tag: "movement"
  readonly x: number
  readonly y: number
  readonly z: number
  readonly rotation: number
  readonly timestamp: number
}

export interface SkillActivateMessage {
  readonly _tag: "skill_activate"
  readonly skillId: string
  readonly targetId: string | null
}

export interface ChatMessage {
  readonly _tag: "chat"
  readonly channel: string
  readonly message: string
}

export interface TradeRequestMessage {
  readonly _tag: "trade_request"
  readonly targetPlayerId: string
}

export interface ItemUseMessage {
  readonly _tag: "item_use"
  readonly itemId: string
}

export interface ItemEquipMessage {
  readonly _tag: "item_equip"
  readonly itemId: string
  readonly slot: string
}

export interface HeartbeatMessage {
  readonly _tag: "heartbeat"
  readonly timestamp: number
}

export interface ZoneChangeMessage {
  readonly _tag: "zone_change"
  readonly targetZoneId: string
}

export interface CreateCharacterMessage {
  readonly _tag: "create_character"
  readonly name: string
  readonly classId: number
}

export type ClientMessage =
  | MovementMessage
  | SkillActivateMessage
  | ChatMessage
  | TradeRequestMessage
  | ItemUseMessage
  | ItemEquipMessage
  | HeartbeatMessage
  | ZoneChangeMessage
  | CreateCharacterMessage

// ============================================================
// Server → Client messages
// ============================================================

export interface StateUpdateMessage {
  readonly _tag: "state_update"
  readonly players: readonly {
    readonly id: string
    readonly x: number
    readonly y: number
    readonly z: number
    readonly rotation: number
  }[]
  readonly timestamp: number
}

export interface DamageMessage {
  readonly _tag: "damage"
  readonly attackerId: string
  readonly targetId: string
  readonly damage: number
  readonly isCritical: boolean
}

export interface ChatBroadcastMessage {
  readonly _tag: "chat_broadcast"
  readonly senderId: string
  readonly senderName: string
  readonly channel: string
  readonly message: string
  readonly timestamp: number
}

export interface ErrorMessage {
  readonly _tag: "error"
  readonly code: string
  readonly message: string
}

export interface HeartbeatAckMessage {
  readonly _tag: "heartbeat_ack"
  readonly serverTime: number
}

export interface ConnectionReadyMessage {
  readonly _tag: "connection_ready"
  readonly playerId: string
  readonly name: string
  readonly level: number
  readonly floor: number
}

export interface PlayerJoinedMessage {
  readonly _tag: "player_joined"
  readonly playerId: string
  readonly name: string
  readonly level: number
}

export interface PlayerLeftMessage {
  readonly _tag: "player_left"
  readonly playerId: string
}

export interface PlayerMovedMessage {
  readonly _tag: "player_moved"
  readonly playerId: string
  readonly x: number
  readonly y: number
  readonly z: number
  readonly rotation: number
  readonly timestamp: number
}

export interface ZoneStateMessage {
  readonly _tag: "zone_state"
  readonly zoneId: string
  readonly zoneName: string
  readonly zoneType: string
  readonly isSafeZone: boolean
  readonly spawnX: number
  readonly spawnY: number
  readonly spawnZ: number
  readonly players: readonly {
    readonly playerId: string
    readonly x: number
    readonly y: number
    readonly z: number
    readonly rotation: number
  }[]
}

export interface CharacterDataMessage {
  readonly _tag: "character_data"
  readonly characterId: string
  readonly name: string
  readonly level: number
  readonly experience: number
  readonly currentHp: number
  readonly maxHp: number
  readonly currentFloor: number
  readonly col: number
  readonly stats: {
    readonly str: number
    readonly agi: number
    readonly vit: number
    readonly dex: number
    readonly int: number
    readonly lck: number
  }
}

export interface CharacterCreateErrorMessage {
  readonly _tag: "character_create_error"
  readonly code: string
  readonly message: string
}

export interface NoCharacterMessage {
  readonly _tag: "no_character"
}

export type ServerMessage =
  | StateUpdateMessage
  | DamageMessage
  | ChatBroadcastMessage
  | ErrorMessage
  | HeartbeatAckMessage
  | ConnectionReadyMessage
  | PlayerJoinedMessage
  | PlayerLeftMessage
  | PlayerMovedMessage
  | ZoneStateMessage
  | CharacterDataMessage
  | CharacterCreateErrorMessage
  | NoCharacterMessage
