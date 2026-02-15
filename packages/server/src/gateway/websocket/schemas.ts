import { Schema } from "effect"

export const MovementSchema = Schema.Struct({
  _tag: Schema.Literal("movement"),
  x: Schema.Number,
  y: Schema.Number,
  z: Schema.Number,
  rotation: Schema.Number,
  timestamp: Schema.Number,
})

export const SkillActivateSchema = Schema.Struct({
  _tag: Schema.Literal("skill_activate"),
  skillId: Schema.String,
  targetId: Schema.NullOr(Schema.String),
})

export const SkillCancelSchema = Schema.Struct({
  _tag: Schema.Literal("skill_cancel"),
  skillId: Schema.String,
})

export const ChatSchema = Schema.Struct({
  _tag: Schema.Literal("chat"),
  channel: Schema.String,
  message: Schema.String.pipe(Schema.maxLength(500)),
})

export const TradeRequestSchema = Schema.Struct({
  _tag: Schema.Literal("trade_request"),
  targetPlayerId: Schema.String,
})

export const TradeAcceptSchema = Schema.Struct({
  _tag: Schema.Literal("trade_accept"),
  tradeId: Schema.String,
})

export const ItemUseSchema = Schema.Struct({
  _tag: Schema.Literal("item_use"),
  itemId: Schema.String,
})

export const ItemEquipSchema = Schema.Struct({
  _tag: Schema.Literal("item_equip"),
  itemId: Schema.String,
  slot: Schema.String,
})

export const HeartbeatSchema = Schema.Struct({
  _tag: Schema.Literal("heartbeat"),
  timestamp: Schema.Number,
})

export const ClientMessageSchema = Schema.Union(
  MovementSchema,
  SkillActivateSchema,
  SkillCancelSchema,
  ChatSchema,
  TradeRequestSchema,
  TradeAcceptSchema,
  ItemUseSchema,
  ItemEquipSchema,
  HeartbeatSchema,
)

export type ValidatedClientMessage = typeof ClientMessageSchema.Type
