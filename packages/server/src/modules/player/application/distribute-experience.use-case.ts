import { Effect } from "effect"
import type { PlayerId } from "../../../shared/kernel/types"
import { CharacterRepository } from "../ports/outbound/character.repository"
import { PartyLookup } from "../ports/outbound/party-lookup.port"
import { EventBus } from "../../../shared/infrastructure/event-bus/index"
import { grantExperience } from "./grant-experience.use-case"
import type { PlayerNotFoundError, MaxLevelReachedError } from "../domain/errors"

const PARTY_XP_RANGE = 50 // Units — party members must be within this range to share XP

export interface XpDistributionResult {
  readonly recipients: Array<{ playerId: PlayerId; xpGranted: number }>
}

/**
 * Distribute experience points from a monster kill.
 *
 * - **Solo mode** (no party): 100% XP to killer
 * - **Party mode**: XP split equally among party members within range
 *
 * @param killerId - The player who dealt the killing blow
 * @param baseXp - Total XP reward from the monster
 * @param killerPosition - Position of the killer for range check
 * @param partyMemberPositions - Map of party member positions for range filtering
 */
export const distributeExperience = (
  killerId: PlayerId,
  baseXp: number,
  killerPosition: { x: number; z: number },
  partyMemberPositions: Map<PlayerId, { x: number; z: number }>,
): Effect.Effect<
  XpDistributionResult,
  PlayerNotFoundError | MaxLevelReachedError,
  CharacterRepository | PartyLookup | EventBus
> =>
  Effect.gen(function* () {
    const partyLookup = yield* PartyLookup

    // Check if the killer is in a party
    const partyMembers = yield* partyLookup.getPartyMembers(killerId)

    if (!partyMembers) {
      // Solo mode: 100% XP to killer
      yield* grantExperience(killerId, baseXp)
      return { recipients: [{ playerId: killerId, xpGranted: baseXp }] }
    }

    // Party mode: filter members within range
    const inRangeMembers = partyMembers.filter((memberId) => {
      if (memberId === killerId) return true // killer always gets XP
      const memberPos = partyMemberPositions.get(memberId)
      if (!memberPos) return false
      const dx = memberPos.x - killerPosition.x
      const dz = memberPos.z - killerPosition.z
      return Math.hypot(dx, dz) <= PARTY_XP_RANGE
    })

    // Split XP equally among in-range members
    const xpPerMember = Math.floor(baseXp / inRangeMembers.length)
    const recipients: Array<{ playerId: PlayerId; xpGranted: number }> = []

    for (const memberId of inRangeMembers) {
      yield* grantExperience(memberId, xpPerMember).pipe(
        Effect.catchAll(() => Effect.void),
      )
      recipients.push({ playerId: memberId, xpGranted: xpPerMember })
    }

    return { recipients }
  })
