import { Effect } from "effect"
import type { PlayerId } from "../../shared/kernel/types.js"

export interface ClientMessage {
  readonly _tag: string
  readonly [key: string]: unknown
}

export const routeMessage = (
  _msg: ClientMessage,
  _playerId: PlayerId,
): Effect.Effect<void> =>
  // TODO: Implement routing with Match.type in Sprint 3
  Effect.void
