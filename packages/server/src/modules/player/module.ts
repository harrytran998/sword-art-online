import { Layer } from "effect"
import { PgCharacterRepositoryLive } from "./adapters/outbound/pg-character.repository"
import { PlayerPortLive } from "./adapters/inbound/player-port.live"
import { StubPartyLookupLive } from "./adapters/outbound/stub-party-lookup"

export const PlayerModule = PlayerPortLive.pipe(
  Layer.provideMerge(PgCharacterRepositoryLive),
  Layer.provideMerge(StubPartyLookupLive),
)
