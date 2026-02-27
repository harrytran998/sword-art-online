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
  skillId: Schema.Number.pipe(Schema.int(), Schema.positive()),
  targetId: Schema.NullOr(Schema.String),
})

export const SkillCancelSchema = Schema.Struct({
  _tag: Schema.Literal("skill_cancel"),
})

export const SkillSlotAssignSchema = Schema.Struct({
  _tag: Schema.Literal("skill_slot_assign"),
  skillId: Schema.Number.pipe(Schema.int(), Schema.positive()),
  slotIndex: Schema.Number.pipe(Schema.int(), Schema.greaterThanOrEqualTo(0), Schema.lessThanOrEqualTo(8)),
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

export const ZoneChangeSchema = Schema.Struct({
  _tag: Schema.Literal("zone_change"),
  targetZoneId: Schema.String.pipe(
    Schema.maxLength(64),
    Schema.pattern(/^[a-z0-9_]+$/),
  ),
})

export const CreateCharacterSchema = Schema.Struct({
  _tag: Schema.Literal("create_character"),
  name: Schema.String.pipe(
    Schema.minLength(3),
    Schema.maxLength(20),
    Schema.pattern(/^[a-zA-Z0-9_]+$/),
  ),
  classId: Schema.Number.pipe(
    Schema.int(),
    Schema.greaterThanOrEqualTo(1),
    Schema.lessThanOrEqualTo(7),
  ),
})

export const PartyCreateSchema = Schema.Struct({
  _tag: Schema.Literal("party_create"),
})

export const PartyInviteSchema = Schema.Struct({
  _tag: Schema.Literal("party_invite"),
  targetPlayerId: Schema.String,
})

export const PartyInviteRespondSchema = Schema.Struct({
  _tag: Schema.Literal("party_invite_respond"),
  inviteId: Schema.String,
  accept: Schema.Boolean,
})

export const PartyLeaveSchema = Schema.Struct({
  _tag: Schema.Literal("party_leave"),
})

export const PartyKickSchema = Schema.Struct({
  _tag: Schema.Literal("party_kick"),
  targetPlayerId: Schema.String,
})

export const PartyTransferLeaderSchema = Schema.Struct({
  _tag: Schema.Literal("party_transfer_leader"),
  targetPlayerId: Schema.String,
})

export const PartyDisbandSchema = Schema.Struct({
  _tag: Schema.Literal("party_disband"),
})

export const PartySetLootModeSchema = Schema.Struct({
  _tag: Schema.Literal("party_set_loot_mode"),
  mode: Schema.Union(
    Schema.Literal("free_for_all"),
    Schema.Literal("round_robin"),
    Schema.Literal("leader_distribute"),
  ),
})

export const RaidCreateSchema = Schema.Struct({
  _tag: Schema.Literal("raid_create"),
})

export const RaidJoinPartySchema = Schema.Struct({
  _tag: Schema.Literal("raid_join_party"),
  raidId: Schema.String,
})

export const ClientMessageSchema = Schema.Union(
  MovementSchema,
  SkillActivateSchema,
  SkillCancelSchema,
  SkillSlotAssignSchema,
  ChatSchema,
  TradeRequestSchema,
  TradeAcceptSchema,
  ItemUseSchema,
  ItemEquipSchema,
  HeartbeatSchema,
  ZoneChangeSchema,
  CreateCharacterSchema,
  PartyCreateSchema,
  PartyInviteSchema,
  PartyInviteRespondSchema,
  PartyLeaveSchema,
  PartyKickSchema,
  PartyTransferLeaderSchema,
  PartyDisbandSchema,
  PartySetLootModeSchema,
  RaidCreateSchema,
  RaidJoinPartySchema,
)

export type ValidatedClientMessage = typeof ClientMessageSchema.Type
