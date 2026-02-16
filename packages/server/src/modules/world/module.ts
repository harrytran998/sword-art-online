import { Layer } from "effect"
import { WorldPortLive } from "./adapters/inbound/world-port.live"
import { InMemoryZoneStateLive } from "./adapters/outbound/in-memory-zone-state"
// import { RedisZoneStateLive } from "./adapters/outbound/redis-zone-state"
import { PgZoneRepositoryLive } from "./adapters/outbound/pg-zone.repository"

// Swap InMemoryZoneStateLive → RedisZoneStateLive for Redis-backed zone tracking
const ZoneStateLayer = InMemoryZoneStateLive
// const ZoneStateLayer = RedisZoneStateLive

export const WorldModule = WorldPortLive.pipe(
  Layer.provideMerge(ZoneStateLayer),
  Layer.provideMerge(PgZoneRepositoryLive),
)
