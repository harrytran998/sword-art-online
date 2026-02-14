import { Brand } from "effect"

export type PlayerId = string & Brand.Brand<"PlayerId">
export const PlayerId = Brand.nominal<PlayerId>()

export type ZoneId = string & Brand.Brand<"ZoneId">
export const ZoneId = Brand.nominal<ZoneId>()

export type FloorId = number & Brand.Brand<"FloorId">
export const FloorId = Brand.nominal<FloorId>()

export type ItemId = string & Brand.Brand<"ItemId">
export const ItemId = Brand.nominal<ItemId>()

export type GuildId = string & Brand.Brand<"GuildId">
export const GuildId = Brand.nominal<GuildId>()

export type PartyId = string & Brand.Brand<"PartyId">
export const PartyId = Brand.nominal<PartyId>()

export type QuestId = string & Brand.Brand<"QuestId">
export const QuestId = Brand.nominal<QuestId>()

export type AccountId = string & Brand.Brand<"AccountId">
export const AccountId = Brand.nominal<AccountId>()
