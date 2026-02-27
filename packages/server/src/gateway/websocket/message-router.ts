import { Effect, Schema } from "effect"
import type { AccountId, PlayerId, ZoneId } from "../../shared/kernel/types"
import { PlayerPort } from "../../modules/player/ports/inbound/player.port"
import { SocialPort } from "../../modules/social/ports/inbound/social.port"
import { WorldPort } from "../../modules/world/ports/inbound/world.port"
import { ClientMessageSchema, type ValidatedClientMessage } from "./schemas"

export const decodeClientMessage = (raw: unknown) =>
  Schema.decodeUnknown(ClientMessageSchema)(raw)

const fallbackSocial = {
  createParty: () => Effect.succeed({ partyId: "", leaderId: "", lootMode: "free_for_all" as const, members: [] }),
  sendInvite: () => Effect.succeed({ inviteId: "", partyId: "", leaderId: "" }),
  respondInvite: () => Effect.succeed(null),
  leaveParty: () => Effect.succeed(null),
  kickMember: () => Effect.succeed({ partyId: "", leaderId: "", lootMode: "free_for_all" as const, members: [] }),
  transferLeader: () => Effect.succeed({ partyId: "", leaderId: "", lootMode: "free_for_all" as const, members: [] }),
  disbandParty: () => Effect.succeed(null),
  setLootMode: () => Effect.succeed({ partyId: "", leaderId: "", lootMode: "free_for_all" as const, members: [] }),
  getPartyByPlayerId: () => Effect.succeed(null),
  updateMemberSnapshot: () => Effect.succeed(null),
  createRaid: () => Effect.succeed({ raidId: "", leaderId: "", partyIds: [], memberCount: 0, members: [] }),
  joinRaidByPartyLeader: () => Effect.succeed({ raidId: "", leaderId: "", partyIds: [], memberCount: 0, members: [] }),
  getRaidByPlayerId: () => Effect.succeed(null),
  distributeSharedExperience: () => Effect.succeed([]),
  selectLootRecipient: (_partyId: string, fallbackPlayerId: PlayerId) => Effect.succeed(fallbackPlayerId),
  selectRaidLootRecipient: (_raidId: string, fallbackPlayerId: PlayerId) => Effect.succeed(fallbackPlayerId),
  getPartyChatRecipients: (senderId: PlayerId) => Effect.succeed([senderId] as const),
  getRaidChatRecipients: (senderId: PlayerId) => Effect.succeed([senderId] as const),
}

const withSocial = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
  effect.pipe(Effect.provideService(SocialPort, fallbackSocial))

export const routeMessage = (
  msg: ValidatedClientMessage,
  playerId: PlayerId,
  accountId: AccountId,
): Effect.Effect<unknown, unknown, WorldPort | PlayerPort> => {
  switch (msg._tag) {
    case "movement":
      return withSocial(
        Effect.gen(function* () {
          const world = yield* WorldPort
          const social = yield* SocialPort
          const player = yield* PlayerPort

          yield* world.handleMovement(playerId, {
            x: msg.x,
            y: msg.y,
            z: msg.z,
            rotation: msg.rotation,
            timestamp: msg.timestamp,
          })

          const character = yield* player.getPlayer(playerId).pipe(
            Effect.catchAll(() => Effect.succeed(null)),
          )

          yield* social.updateMemberSnapshot(playerId, {
            x: msg.x,
            z: msg.z,
            currentHp: character?.currentHp ?? 100,
            maxHp: character?.maxHp ?? 100,
            currentMp: character?.computeMaxMp() ?? 50,
            maxMp: character?.computeMaxMp() ?? 50,
            level: character?.level ?? 1,
            name: character?.name ?? "",
          })
        }),
      )

    case "heartbeat":
      return Effect.succeed({
        _tag: "heartbeat_ack" as const,
        serverTime: Date.now(),
        clientTime: msg.timestamp,
      })

    case "zone_change":
      return Effect.gen(function* () {
        const world = yield* WorldPort
        const result = yield* world.changeZone(playerId, msg.targetZoneId as ZoneId)
        return { _tag: "zone_state" as const, ...result }
      })

    case "create_character":
      return Effect.gen(function* () {
        const player = yield* PlayerPort
        const character = yield* player.createCharacter({
          accountId,
          name: msg.name,
          classId: msg.classId,
        })

        return {
          _tag: "character_data" as const,
          characterId: character.id,
          name: character.name,
          level: character.level,
          experience: character.experience,
          currentHp: character.currentHp,
          maxHp: character.maxHp,
          currentFloor: character.currentFloor,
          col: character.col,
          stats: character.stats,
        }
      })

    case "chat":
      return withSocial(
        Effect.gen(function* () {
          if (msg.channel === "party") {
            const social = yield* SocialPort
            const recipients = yield* social.getPartyChatRecipients(playerId)
            return {
              _tag: "party_chat_broadcast" as const,
              recipients,
              senderId: playerId,
              senderName: "",
              channel: "party",
              message: msg.message,
              timestamp: Date.now(),
            }
          }

          if (msg.channel === "raid") {
            const social = yield* SocialPort
            const recipients = yield* social.getRaidChatRecipients(playerId)
            return {
              _tag: "party_chat_broadcast" as const,
              recipients,
              senderId: playerId,
              senderName: "",
              channel: "raid",
              message: msg.message,
              timestamp: Date.now(),
            }
          }

          return {
            _tag: "chat_broadcast" as const,
            senderId: playerId,
            senderName: "",
            channel: msg.channel,
            message: msg.message,
            timestamp: Date.now(),
          }
        }),
      )

    case "party_create":
      return withSocial(
        Effect.gen(function* () {
          const social = yield* SocialPort
          const party = yield* social.createParty(playerId)
          return { _tag: "party_state" as const, ...party }
        }),
      )

    case "party_invite":
      return withSocial(
        Effect.gen(function* () {
          const social = yield* SocialPort
          const invite = yield* social.sendInvite(playerId, msg.targetPlayerId as PlayerId)
          return {
            _tag: "party_invite_received" as const,
            inviteId: invite.inviteId,
            partyId: invite.partyId,
            leaderId: invite.leaderId,
            targetPlayerId: msg.targetPlayerId,
          }
        }),
      )

    case "party_invite_respond":
      return withSocial(
        Effect.gen(function* () {
          const social = yield* SocialPort
          const party = yield* social.respondInvite(playerId, msg.inviteId, msg.accept)
          if (!party) {
            return {
              _tag: "error" as const,
              code: "PARTY_INVITE_INVALID",
              message: "Invite is no longer valid",
            }
          }
          return { _tag: "party_state" as const, ...party }
        }),
      )

    case "party_leave":
      return withSocial(
        Effect.gen(function* () {
          const social = yield* SocialPort
          const party = yield* social.leaveParty(playerId)
          if (!party) return { _tag: "party_disbanded" as const, partyId: "" }
          return { _tag: "party_state" as const, ...party }
        }),
      )

    case "party_kick":
      return withSocial(
        Effect.gen(function* () {
          const social = yield* SocialPort
          const party = yield* social.kickMember(playerId, msg.targetPlayerId as PlayerId)
          return { _tag: "party_state" as const, ...party }
        }),
      )

    case "party_transfer_leader":
      return withSocial(
        Effect.gen(function* () {
          const social = yield* SocialPort
          const party = yield* social.transferLeader(playerId, msg.targetPlayerId as PlayerId)
          return { _tag: "party_state" as const, ...party }
        }),
      )

    case "party_disband":
      return withSocial(
        Effect.gen(function* () {
          const social = yield* SocialPort
          const partyId = yield* social.disbandParty(playerId)
          return { _tag: "party_disbanded" as const, partyId: partyId ?? "" }
        }),
      )

    case "party_set_loot_mode":
      return withSocial(
        Effect.gen(function* () {
          const social = yield* SocialPort
          const party = yield* social.setLootMode(playerId, msg.mode)
          return { _tag: "party_state" as const, ...party }
        }),
      )

    case "raid_create":
      return withSocial(
        Effect.gen(function* () {
          const social = yield* SocialPort
          const raid = yield* social.createRaid(playerId)
          return { _tag: "raid_state" as const, ...raid }
        }),
      )

    case "raid_join_party":
      return withSocial(
        Effect.gen(function* () {
          const social = yield* SocialPort
          const raid = yield* social.joinRaidByPartyLeader(playerId, msg.raidId)
          return { _tag: "raid_state" as const, ...raid }
        }),
      )

    case "skill_activate":
      return Effect.logDebug("Skill activate not yet implemented").pipe(Effect.as(undefined))
    case "skill_cancel":
      return Effect.logDebug("Skill cancel not yet implemented").pipe(Effect.as(undefined))
    case "skill_slot_assign":
      return Effect.logDebug("Skill slot assign not yet implemented").pipe(Effect.as(undefined))
    case "trade_request":
      return Effect.logDebug("Trade request not yet implemented").pipe(Effect.as(undefined))
    case "trade_accept":
      return Effect.logDebug("Trade accept not yet implemented").pipe(Effect.as(undefined))
    case "item_use":
      return Effect.logDebug("Item use not yet implemented").pipe(Effect.as(undefined))
    case "item_equip":
      return Effect.logDebug("Item equip not yet implemented").pipe(Effect.as(undefined))
    default:
      return Effect.void
  }
}
