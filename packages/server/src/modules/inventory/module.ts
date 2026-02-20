import { Layer } from "effect"
import { InMemoryInventoryRepositoryLive, PgItemDefinitionRepositoryLive } from "./adapters/outbound/inventory.repository.live"
import { InventoryPortLive } from "./adapters/inbound/inventory-port.live"
import { DatabaseService } from "../../shared/infrastructure/database/index"

const InventoryRepositoriesLive = Layer.mergeAll(
  InMemoryInventoryRepositoryLive,
  PgItemDefinitionRepositoryLive,
)

export const InventoryModule = InventoryPortLive.pipe(
  Layer.provideMerge(InventoryRepositoriesLive),
  Layer.provide(Layer.succeed(DatabaseService, {} as any)),
)
