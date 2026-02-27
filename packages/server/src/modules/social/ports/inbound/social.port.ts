import { Context, Effect } from "effect"
import type { PlayerId } from "../../../../shared/kernel/types"
import type { LootDistributionMode, PartyMemberSnapshot } from "../../domain/entities/party"

export interface PartyView {
  readonly partyId: string
  readonly leaderId: string
  readonly lootMode: LootDistributionMode
  readonly members: readonly PartyMemberSnapshot[]
}

export interface RaidView {
  readonly raidId: string
  readonly leaderId: string
  readonly partyIds: readonly string[]
  readonly memberCount: number
  readonly members: readonly PartyMemberSnapshot[]
}

export interface PartyInviteView {
  readonly inviteId: string
  readonly partyId: string
  readonly leaderId: string
}

export class SocialPort extends Context.Tag("SocialPort")<
  SocialPort,
  {
    readonly createParty: (leaderId: PlayerId) => Effect.Effect<PartyView>
    readonly sendInvite: (
      leaderId: PlayerId,
      targetPlayerId: PlayerId,
    ) => Effect.Effect<PartyInviteView>
    readonly respondInvite: (
      playerId: PlayerId,
      inviteId: string,
      accept: boolean,
    ) => Effect.Effect<PartyView | null>
    readonly leaveParty: (playerId: PlayerId) => Effect.Effect<PartyView | null>
    readonly kickMember: (
      leaderId: PlayerId,
      targetPlayerId: PlayerId,
    ) => Effect.Effect<PartyView>
    readonly transferLeader: (
      leaderId: PlayerId,
      targetPlayerId: PlayerId,
    ) => Effect.Effect<PartyView>
    readonly disbandParty: (leaderId: PlayerId) => Effect.Effect<string | null>
    readonly setLootMode: (
      leaderId: PlayerId,
      mode: LootDistributionMode,
    ) => Effect.Effect<PartyView>
    readonly getPartyByPlayerId: (
      playerId: PlayerId,
    ) => Effect.Effect<PartyView | null>
    readonly updateMemberSnapshot: (
      playerId: PlayerId,
      patch: Partial<PartyMemberSnapshot>,
    ) => Effect.Effect<PartyView | null>
    readonly createRaid: (leaderId: PlayerId) => Effect.Effect<RaidView>
    readonly joinRaidByPartyLeader: (
      partyLeaderId: PlayerId,
      raidId: string,
    ) => Effect.Effect<RaidView>
    readonly getRaidByPlayerId: (playerId: PlayerId) => Effect.Effect<RaidView | null>
    readonly distributeSharedExperience: (
      killerId: PlayerId,
      baseExperience: number,
    ) => Effect.Effect<readonly { playerId: PlayerId; experience: number }[]>
    readonly selectLootRecipient: (
      partyId: string,
      fallbackPlayerId: PlayerId,
    ) => Effect.Effect<PlayerId>
    readonly selectRaidLootRecipient: (
      raidId: string,
      fallbackPlayerId: PlayerId,
    ) => Effect.Effect<PlayerId>
    readonly getPartyChatRecipients: (
      senderId: PlayerId,
    ) => Effect.Effect<readonly PlayerId[]>
    readonly getRaidChatRecipients: (
      senderId: PlayerId,
    ) => Effect.Effect<readonly PlayerId[]>
  }
>() {}
