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

export type ClientMessage =
  | MovementMessage
  | SkillActivateMessage
  | ChatMessage
  | TradeRequestMessage
  | ItemUseMessage
  | ItemEquipMessage

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

export type ServerMessage =
  | StateUpdateMessage
  | DamageMessage
  | ChatBroadcastMessage
  | ErrorMessage
