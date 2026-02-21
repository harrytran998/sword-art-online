import { Context, Effect } from "effect"
import type { PlayerId } from "../../../../shared/kernel/types"

/**
 * Lightweight port for looking up party members.
 * Returns player IDs of party members, or null if the player is solo.
 *
 * This is a thin interface that will be implemented by the Social module in Phase 2.
 * For now, a stub implementation always returns null (solo mode).
 */
export class PartyLookup extends Context.Tag("PartyLookup")<
  PartyLookup,
  {
    readonly getPartyMembers: (
      playerId: PlayerId,
    ) => Effect.Effect<PlayerId[] | null>
  }
>() {}
