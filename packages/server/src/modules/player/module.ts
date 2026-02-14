import { Layer } from "effect"
import { PgCharacterRepositoryLive } from "./adapters/outbound/pg-character.repository.js"
import { PlayerPortLive } from "./adapters/inbound/player-port.live.js"

export const PlayerModule = PlayerPortLive.pipe(
  Layer.provideMerge(PgCharacterRepositoryLive),
)
