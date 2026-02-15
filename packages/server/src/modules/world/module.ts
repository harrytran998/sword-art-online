import { Layer } from "effect"
import { WorldPortLive } from "./adapters/inbound/world-port.live.js"
import { InMemoryZoneStateLive } from "./adapters/outbound/in-memory-zone-state.js"

export const WorldModule = WorldPortLive.pipe(
  Layer.provideMerge(InMemoryZoneStateLive),
)
