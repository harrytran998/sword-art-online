import { Layer } from "effect"
import { PgInventoryRepositoryLive, PgItemDefinitionRepositoryLive } from "./adapters/outbound/inventory.repository.live"
import { InventoryPortLive } from "./adapters/inbound/inventory-port.live"
import { InventoryLockLive } from "./domain/security/inventory-lock"
import { DatabaseService } from "../../shared/infrastructure/database/index"
import { CacheServiceLive } from "../../shared/infrastructure/cache/index"
import { InventorySubscriptionsLive } from "./events/subscriptions"

const InventoryRepositoriesLive = Layer.mergeAll(
  PgInventoryRepositoryLive,
  PgItemDefinitionRepositoryLive,
)

export const InventoryModule = InventoryPortLive.pipe(
  Layer.provideMerge(InventoryRepositoriesLive),
  Layer.provideMerge(InventoryLockLive),
  Layer.provide(Layer.succeed(DatabaseService, {} as any)),
  Layer.provideMerge(CacheServiceLive),
  Layer.provideMerge(InventorySubscriptionsLive),
)
