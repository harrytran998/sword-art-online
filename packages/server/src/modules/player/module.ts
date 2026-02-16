import { Layer } from "effect"
import { PgCharacterRepositoryLive } from "./adapters/outbound/pg-character.repository"
import { PlayerPortLive } from "./adapters/inbound/player-port.live"

export const PlayerModule = PlayerPortLive.pipe(
  Layer.provideMerge(PgCharacterRepositoryLive),
)
