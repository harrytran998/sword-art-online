import { Layer } from "effect"
import { WorldPortLive } from "./adapters/inbound/world-port.live"
import { InMemoryZoneStateLive } from "./adapters/outbound/in-memory-zone-state"

export const WorldModule = WorldPortLive.pipe(
  Layer.provideMerge(InMemoryZoneStateLive),
)
