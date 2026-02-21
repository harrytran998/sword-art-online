import { Effect, Layer } from "effect"
import { PartyLookup } from "../../ports/outbound/party-lookup.port"

/**
 * Stub implementation of PartyLookup that always returns null (solo mode).
 * Will be replaced by the Social module's real implementation in Phase 2.
 */
export const StubPartyLookupLive = Layer.succeed(
  PartyLookup,
  {
    getPartyMembers: () => Effect.succeed(null),
  },
)
