import type { PlayerId, PartyId } from "../../../../shared/kernel/types"

export type LootDistributionMode =
  | "free_for_all"
  | "round_robin"
  | "leader_distribute"

export interface PartyMemberSnapshot {
  readonly playerId: PlayerId
  readonly name: string
  readonly level: number
  readonly currentHp: number
  readonly maxHp: number
  readonly currentMp: number
  readonly maxMp: number
  readonly x: number
  readonly z: number
}

export interface Party {
  readonly id: PartyId
  readonly leaderId: PlayerId
  readonly members: readonly PlayerId[]
  readonly lootMode: LootDistributionMode
  readonly memberSnapshots: Readonly<Record<string, PartyMemberSnapshot>>
  readonly createdAt: number
}

export const PARTY_MAX_MEMBERS = 6
