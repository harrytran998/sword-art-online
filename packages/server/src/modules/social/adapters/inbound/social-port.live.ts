import { Effect, Layer } from "effect"
import { CacheService } from "../../../../shared/infrastructure/cache/index"
import type { PlayerId } from "../../../../shared/kernel/types"
import { EventBus } from "../../../../shared/infrastructure/event-bus/index"
import {
  PARTY_MAX_MEMBERS,
  type Party,
  type PartyMemberSnapshot,
} from "../../domain/entities/party"
import {
  SocialPort,
  type PartyInviteView,
  type PartyView,
  type RaidView,
} from "../../ports/inbound/social.port"
import { PartyCreated } from "../../events/published"

interface PartyInvite {
  readonly inviteId: string
  readonly partyId: string
  readonly leaderId: PlayerId
  readonly targetPlayerId: PlayerId
  readonly expiresAt: number
}

interface Raid {
  readonly raidId: string
  readonly leaderId: PlayerId
  readonly partyIds: readonly string[]
}

const partyKey = (partyId: string): string => `social:party:${partyId}`
const playerPartyKey = (playerId: string): string => `social:player_party:${playerId}`
const playerInvitesKey = (playerId: string): string => `social:party_invites:${playerId}`
const raidKey = (raidId: string): string => `social:raid:${raidId}`
const partyRaidKey = (partyId: string): string => `social:party_raid:${partyId}`
const partyLootIndexKey = (partyId: string): string => `social:party_loot_index:${partyId}`

const createPartyId = (): string =>
  `party_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

const createInviteId = (): string =>
  `inv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

const createRaidId = (): string =>
  `raid_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

const toPartyView = (party: Party): PartyView => ({
  partyId: party.id,
  leaderId: party.leaderId,
  lootMode: party.lootMode,
  members: party.members.map((memberId) =>
    party.memberSnapshots[memberId] ?? {
      playerId: memberId,
      name: "",
      level: 1,
      currentHp: 100,
      maxHp: 100,
      currentMp: 50,
      maxMp: 50,
      x: 0,
      z: 0,
    },
  ),
})

const toRaidView = (
  raid: Raid,
  memberCount: number,
  members: readonly PartyMemberSnapshot[],
): RaidView => ({
  raidId: raid.raidId,
  leaderId: raid.leaderId,
  partyIds: raid.partyIds,
  memberCount,
  members,
})

export const SocialPortLive = Layer.effect(
  SocialPort,
  Effect.gen(function* () {
    const cache = yield* CacheService
    const eventBus = yield* EventBus

    const readParty = (partyId: string): Effect.Effect<Party | null> =>
      Effect.gen(function* () {
        const raw = yield* cache.get(partyKey(partyId))
        if (!raw) return null
        return JSON.parse(raw) as Party
      })

    const writeParty = (party: Party): Effect.Effect<void> =>
      cache.set(partyKey(party.id), JSON.stringify(party), 60 * 60 * 24)

    const getPartyByPlayerIdInternal = (
      playerId: PlayerId,
    ): Effect.Effect<Party | null> =>
      Effect.gen(function* () {
        const id = yield* cache.get(playerPartyKey(playerId))
        if (!id) return null
        return yield* readParty(id)
      })

    const savePartyForMembers = (party: Party): Effect.Effect<void> =>
      Effect.gen(function* () {
        yield* writeParty(party)
        for (const memberId of party.members) {
          yield* cache.set(playerPartyKey(memberId), party.id, 60 * 60 * 24)
        }
      })

    const readPartyInvites = (
      playerId: PlayerId,
    ): Effect.Effect<PartyInvite[]> =>
      Effect.gen(function* () {
        const raw = yield* cache.get(playerInvitesKey(playerId))
        if (!raw) return []
        return JSON.parse(raw) as PartyInvite[]
      })

    const countRaidMembers = (partyIds: readonly string[]): Effect.Effect<number> =>
      Effect.gen(function* () {
        let count = 0
        for (const partyId of partyIds) {
          const party = yield* readParty(partyId)
          count += party?.members.length ?? 0
        }
        return count
      })

    const getRaidMembers = (
      partyIds: readonly string[],
    ): Effect.Effect<PartyMemberSnapshot[]> =>
      Effect.gen(function* () {
        const members: PartyMemberSnapshot[] = []
        for (const partyId of partyIds) {
          const party = yield* readParty(partyId)
          if (party) {
            for (const memberId of party.members) {
              const snapshot = party.memberSnapshots[memberId]
              if (snapshot) {
                members.push(snapshot)
              } else {
                members.push({
                  playerId: memberId,
                  name: "",
                  level: 1,
                  currentHp: 100,
                  maxHp: 100,
                  currentMp: 50,
                  maxMp: 50,
                  x: 0,
                  z: 0,
                })
              }
            }
          }
        }
        return members
      })

    return {
      createParty: (leaderId) =>
        Effect.gen(function* () {
          const existing = yield* getPartyByPlayerIdInternal(leaderId)
          if (existing) return toPartyView(existing)

          const party: Party = {
            id: createPartyId() as Party["id"],
            leaderId,
            members: [leaderId],
            lootMode: "free_for_all",
            memberSnapshots: {
              [leaderId]: {
                playerId: leaderId,
                name: "",
                level: 1,
                currentHp: 100,
                maxHp: 100,
                currentMp: 50,
                maxMp: 50,
                x: 0,
                z: 0,
              },
            },
            createdAt: Date.now(),
          }

          yield* savePartyForMembers(party)
          yield* eventBus.publish(
            new PartyCreated({
              timestamp: new Date(),
              aggregateId: party.id,
              partyId: party.id,
              leaderId,
            }),
          )
          return toPartyView(party)
        }),

      sendInvite: (leaderId, targetPlayerId) =>
        Effect.gen(function* () {
          let party = yield* getPartyByPlayerIdInternal(leaderId)
          if (!party) {
            const created = yield* (SocialPort as unknown as {
              Service: { createParty: (leader: PlayerId) => Effect.Effect<PartyView> }
            }).Service.createParty(leaderId)
            party = yield* readParty(created.partyId)
          }
          if (!party) {
            return { inviteId: createInviteId(), partyId: "", leaderId }
          }

          if (party.leaderId !== leaderId) {
            return { inviteId: createInviteId(), partyId: party.id, leaderId }
          }
          if (party.members.length >= PARTY_MAX_MEMBERS) {
            return { inviteId: createInviteId(), partyId: party.id, leaderId }
          }

          const targetParty = yield* getPartyByPlayerIdInternal(targetPlayerId)
          if (targetParty) {
            return { inviteId: createInviteId(), partyId: party.id, leaderId }
          }

          const invite: PartyInvite = {
            inviteId: createInviteId(),
            partyId: party.id,
            leaderId,
            targetPlayerId,
            expiresAt: Date.now() + 60 * 1000,
          }

          const existing = yield* readPartyInvites(targetPlayerId)
          const active = existing.filter((x) => x.expiresAt > Date.now())
          active.push(invite)
          yield* cache.set(playerInvitesKey(targetPlayerId), JSON.stringify(active), 5 * 60)

          const view: PartyInviteView = {
            inviteId: invite.inviteId,
            partyId: invite.partyId,
            leaderId: invite.leaderId,
          }
          return view
        }),

      respondInvite: (playerId, inviteId, accept) =>
        Effect.gen(function* () {
          const existing = yield* readPartyInvites(playerId)
          const active = existing.filter((x) => x.expiresAt > Date.now())
          const invite = active.find((x) => x.inviteId === inviteId)
          const remaining = active.filter((x) => x.inviteId !== inviteId)
          yield* cache.set(playerInvitesKey(playerId), JSON.stringify(remaining), 5 * 60)

          if (!invite || !accept) return null

          const alreadyParty = yield* getPartyByPlayerIdInternal(playerId)
          if (alreadyParty) return toPartyView(alreadyParty)

          const party = yield* readParty(invite.partyId)
          if (!party) return null
          if (party.members.length >= PARTY_MAX_MEMBERS) {
            return null
          }

          const updated: Party = {
            ...party,
            members: [...party.members, playerId],
            memberSnapshots: {
              ...party.memberSnapshots,
              [playerId]: {
                playerId,
                name: "",
                level: 1,
                currentHp: 100,
                maxHp: 100,
                currentMp: 50,
                maxMp: 50,
                x: 0,
                z: 0,
              },
            },
          }

          yield* savePartyForMembers(updated)
          return toPartyView(updated)
        }),

      leaveParty: (playerId) =>
        Effect.gen(function* () {
          const party = yield* getPartyByPlayerIdInternal(playerId)
          if (!party) return null

          const remainingMembers = party.members.filter((memberId) => memberId !== playerId)
          yield* cache.del(playerPartyKey(playerId))

          if (remainingMembers.length < 2) {
            for (const memberId of remainingMembers) {
              yield* cache.del(playerPartyKey(memberId))
            }
            yield* cache.del(partyKey(party.id))
            return null
          }

          const nextLeader = party.leaderId === playerId ? remainingMembers[0] : party.leaderId
          if (!nextLeader) return null

          const updated: Party = {
            ...party,
            leaderId: nextLeader,
            members: remainingMembers,
            memberSnapshots: Object.fromEntries(
              Object.entries(party.memberSnapshots).filter(([id]) => id !== playerId),
            ),
          }

          yield* savePartyForMembers(updated)
          return toPartyView(updated)
        }),

      kickMember: (leaderId, targetPlayerId) =>
        Effect.gen(function* () {
          const party = yield* getPartyByPlayerIdInternal(leaderId)
          if (!party || party.leaderId !== leaderId) {
            return {
              partyId: "",
              leaderId,
              lootMode: "free_for_all",
              members: [],
            }
          }

          const updatedMembers = party.members.filter((memberId) => memberId !== targetPlayerId)
          if (updatedMembers.length < 1) {
            return {
              partyId: party.id,
              leaderId: party.leaderId,
              lootMode: party.lootMode,
              members: [],
            }
          }

          const updated: Party = {
            ...party,
            members: updatedMembers,
            memberSnapshots: Object.fromEntries(
              Object.entries(party.memberSnapshots).filter(([id]) => id !== targetPlayerId),
            ),
          }

          yield* cache.del(playerPartyKey(targetPlayerId))

          if (updated.members.length < 2) {
            for (const memberId of updated.members) {
              yield* cache.del(playerPartyKey(memberId))
            }
            yield* cache.del(partyKey(updated.id))
            return {
              partyId: updated.id,
              leaderId: updated.leaderId,
              lootMode: updated.lootMode,
              members: [],
            }
          }

          yield* savePartyForMembers(updated)
          return toPartyView(updated)
        }),

      transferLeader: (leaderId, targetPlayerId) =>
        Effect.gen(function* () {
          const party = yield* getPartyByPlayerIdInternal(leaderId)
          if (!party || party.leaderId !== leaderId || !party.members.includes(targetPlayerId)) {
            return {
              partyId: party?.id ?? "",
              leaderId,
              lootMode: "free_for_all",
              members: [],
            }
          }

          const updated: Party = {
            ...party,
            leaderId: targetPlayerId,
          }
          yield* savePartyForMembers(updated)
          return toPartyView(updated)
        }),

      disbandParty: (leaderId) =>
        Effect.gen(function* () {
          const party = yield* getPartyByPlayerIdInternal(leaderId)
          if (!party || party.leaderId !== leaderId) return null

          for (const memberId of party.members) {
            yield* cache.del(playerPartyKey(memberId))
          }
          yield* cache.del(partyKey(party.id))
          return party.id
        }),

      setLootMode: (leaderId, mode) =>
        Effect.gen(function* () {
          const party = yield* getPartyByPlayerIdInternal(leaderId)
          if (!party || party.leaderId !== leaderId) {
            return {
              partyId: party?.id ?? "",
              leaderId,
              lootMode: mode,
              members: [],
            }
          }

          const updated: Party = { ...party, lootMode: mode }
          yield* savePartyForMembers(updated)
          return toPartyView(updated)
        }),

      getPartyByPlayerId: (playerId) =>
        Effect.gen(function* () {
          const party = yield* getPartyByPlayerIdInternal(playerId)
          return party ? toPartyView(party) : null
        }),

      updateMemberSnapshot: (playerId, patch) =>
        Effect.gen(function* () {
          const party = yield* getPartyByPlayerIdInternal(playerId)
          if (!party) return null

          const previous = party.memberSnapshots[playerId] ?? {
            playerId,
            name: "",
            level: 1,
            currentHp: 100,
            maxHp: 100,
            currentMp: 50,
            maxMp: 50,
            x: 0,
            z: 0,
          }
          const nextSnapshot: PartyMemberSnapshot = { ...previous, ...patch }

          const updated: Party = {
            ...party,
            memberSnapshots: {
              ...party.memberSnapshots,
              [playerId]: nextSnapshot,
            },
          }
          yield* savePartyForMembers(updated)
          return toPartyView(updated)
        }),

      createRaid: (leaderId) =>
        Effect.gen(function* () {
          const party = yield* getPartyByPlayerIdInternal(leaderId)
          if (!party || party.leaderId !== leaderId) {
            return { raidId: "", leaderId, partyIds: [], memberCount: 0, members: [] }
          }

          const raid: Raid = {
            raidId: createRaidId(),
            leaderId,
            partyIds: [party.id],
          }

          yield* cache.set(raidKey(raid.raidId), JSON.stringify(raid), 60 * 60 * 24)
          yield* cache.set(partyRaidKey(party.id), raid.raidId, 60 * 60 * 24)
          const members = yield* getRaidMembers(raid.partyIds)
          return toRaidView(raid, party.members.length, members)
        }),

      joinRaidByPartyLeader: (partyLeaderId, raidId) =>
        Effect.gen(function* () {
          const raw = yield* cache.get(raidKey(raidId))
          if (!raw) {
            return { raidId, leaderId: partyLeaderId, partyIds: [], memberCount: 0, members: [] }
          }
          const raid = JSON.parse(raw) as Raid

          const party = yield* getPartyByPlayerIdInternal(partyLeaderId)
          if (!party || party.leaderId !== partyLeaderId) {
            const count = yield* countRaidMembers(raid.partyIds)
            const members = yield* getRaidMembers(raid.partyIds)
            return toRaidView(raid, count, members)
          }

          const alreadyJoined = raid.partyIds.includes(party.id)
          const partyIds = alreadyJoined ? raid.partyIds : [...raid.partyIds, party.id].slice(0, 8)
          const updated: Raid = { ...raid, partyIds }

          yield* cache.set(raidKey(updated.raidId), JSON.stringify(updated), 60 * 60 * 24)
          yield* cache.set(partyRaidKey(party.id), updated.raidId, 60 * 60 * 24)
          const count = yield* countRaidMembers(updated.partyIds)
          const members = yield* getRaidMembers(updated.partyIds)
          return toRaidView(updated, count, members)
        }),

      getRaidByPlayerId: (playerId) =>
        Effect.gen(function* () {
          const party = yield* getPartyByPlayerIdInternal(playerId)
          if (!party) return null

          const raidId = yield* cache.get(partyRaidKey(party.id))
          if (!raidId) return null

          const raw = yield* cache.get(raidKey(raidId))
          if (!raw) return null
          const raid = JSON.parse(raw) as Raid

          const count = yield* countRaidMembers(raid.partyIds)
          const members = yield* getRaidMembers(raid.partyIds)
          return toRaidView(raid, count, members)
        }),

      distributeSharedExperience: (killerId, baseExperience) =>
        Effect.gen(function* () {
          const party = yield* getPartyByPlayerIdInternal(killerId)
          if (!party) {
            return [{ playerId: killerId, experience: baseExperience }] as const
          }

          const share = Math.max(1, Math.floor(baseExperience / party.members.length))
          return party.members.map((playerId) => ({ playerId, experience: share }))
        }),

      selectLootRecipient: (partyId, fallbackPlayerId) =>
        Effect.gen(function* () {
          const party = yield* readParty(partyId)
          if (!party) return fallbackPlayerId

          if (party.lootMode === "free_for_all") return fallbackPlayerId
          if (party.lootMode === "leader_distribute") return party.leaderId

          const current = yield* cache.get(partyLootIndexKey(partyId))
          const index = Number(current ?? "0")
          const next = party.members[index % party.members.length] ?? fallbackPlayerId
          yield* cache.set(partyLootIndexKey(partyId), String(index + 1), 60 * 60 * 24)
          return next
        }),

      selectRaidLootRecipient: (raidId, fallbackPlayerId) =>
        Effect.gen(function* () {
          const raw = yield* cache.get(raidKey(raidId))
          if (!raw) return fallbackPlayerId
          const raid = JSON.parse(raw) as Raid

          const allMembers: PlayerId[] = []
          for (const partyId of raid.partyIds) {
            const party = yield* readParty(partyId)
            if (party) {
              for (const memberId of party.members) {
                allMembers.push(memberId)
              }
            }
          }

          if (allMembers.length === 0) return fallbackPlayerId

          const indexKey = `social:raid_loot_index:${raidId}`
          const current = yield* cache.get(indexKey)
          const index = Number(current ?? "0")
          const next = allMembers[index % allMembers.length] ?? fallbackPlayerId
          yield* cache.set(indexKey, String(index + 1), 60 * 60 * 24)
          return next
        }),

      getPartyChatRecipients: (senderId) =>
        Effect.gen(function* () {
          const party = yield* getPartyByPlayerIdInternal(senderId)
          if (!party) return [senderId] as const
          return party.members
        }),

      getRaidChatRecipients: (senderId) =>
        Effect.gen(function* () {
          const party = yield* getPartyByPlayerIdInternal(senderId)
          if (!party) return [senderId] as const

          const raidId = yield* cache.get(partyRaidKey(party.id))
          if (!raidId) return party.members

          const raw = yield* cache.get(raidKey(raidId))
          if (!raw) return party.members
          const raid = JSON.parse(raw) as Raid

          const recipients: PlayerId[] = []
          for (const partyId of raid.partyIds) {
            const p = yield* readParty(partyId)
            if (p) {
              for (const memberId of p.members) {
                recipients.push(memberId)
              }
            }
          }

          return recipients.length > 0 ? recipients : party.members
        }),
    }
  }),
)
