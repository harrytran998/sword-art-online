import { describe, expect, it } from "bun:test"
import { Effect, Layer } from "effect"
import { InventoryPort } from "../ports/inbound/inventory.port"
import { InventoryPortLive } from "../adapters/inbound/inventory-port.live"
import { InventoryLockLive } from "../domain/security/inventory-lock"
import { InventoryRepository, ItemDefinitionRepository } from "../ports/outbound/inventory.repository"
import { EventBus } from "../../../shared/infrastructure/event-bus/index"
import { CacheService } from "../../../shared/infrastructure/cache/index"
import { ItemId } from "../../../shared/kernel/types"
import { InventorySlot } from "../domain/entities/inventory-slot"
import { ItemDefinition } from "../domain/entities/item-definition"
import { PlayerPort } from "../../player/ports/inbound/player.port"

const makeAtomicCacheLayer = () => {
  const store = new Map<string, string>()
  const locks = new Set<string>()

  return Layer.succeed(CacheService, {
    get: (key) => Effect.sync(() => store.get(key) ?? null),
    set: (key, value) => Effect.sync(() => { store.set(key, value) }),
    del: (key) => Effect.sync(() => { store.delete(key) }),
    increment: () => Effect.succeed(1),
    exists: (key) => Effect.sync(() => store.has(key)),
    expire: () => Effect.void,
    getOrSet: (key, factory) => Effect.gen(function* () {
      if (store.has(key)) return store.get(key)!
      const val = yield* factory()
      store.set(key, val)
      return val
    }),
    acquireLock: (key) => Effect.sync(() => {
      // Very strict lock logic for tests
      if (locks.has(key)) {
        return false
      }
      locks.add(key)
      return true
    }),
    releaseLock: (key) => Effect.sync(() => {
      locks.delete(key)
    }),
    sadd: () => Effect.succeed(1),
    srem: () => Effect.succeed(1),
    smembers: () => Effect.succeed([]),
    scard: () => Effect.succeed(0),
    hset: () => Effect.void,
    hgetall: () => Effect.succeed({}),
    hmset: () => Effect.void,
    hdel: () => Effect.void,
  })
}

const makeInventoryTestMocks = () => {
  const events: any[] = []
  
  const testItemDef = ItemDefinition.create({
    id: 1,
    name: "Health Potion",
    description: "Restores HP",
    category: "consumable",
    subcategory: "potion",
    rarity: "common",
    stats: { healHp: 50 },
    requirements: {},
    maxStack: 99,
    tradeable: true,
    basePrice: 10,
  })

  let testSlot = InventorySlot.create({
    id: "slot-1" as ItemId,
    characterId: "char-100",
    itemDefinition: testItemDef,
    quantity: 1,
    enhancementLevel: 0,
    durability: null,
    slotType: "inventory",
    slotIndex: 0,
  })

  const repoLayer = Layer.succeed(InventoryRepository, {
    getInventorySlots: () => Effect.succeed([testSlot]),
    getEquipmentSlots: () => Effect.succeed(new Map()),
    getSlotById: (id: ItemId) => Effect.gen(function* () {
      // Simulate database latency to surface race conditions
      yield* Effect.sleep(10)
      return id === "slot-1" ? testSlot : null
    }),
    getSlotByIndex: () => Effect.succeed(null),
    findStackableSlot: () => Effect.succeed(null),
    findEmptySlot: () => Effect.succeed(1),
    saveSlot: (slot: InventorySlot) => Effect.sync(() => {
      testSlot = slot
      return slot
    }),
    saveSlots: (slots: InventorySlot[]) => Effect.sync(() => {
      for (const slot of slots) {
        if (slot.id === "slot-1") testSlot = slot
      }
      return slots
    }),
    deleteSlot: () => Effect.sync(() => {
      testSlot = testSlot.withQuantity(0)
    }),
  } as any)

  const defRepoLayer = Layer.succeed(ItemDefinitionRepository, {
    getById: () => Effect.succeed(testItemDef),
    getAllCategories: () => Effect.succeed([]),
  } as any)

  const busLayer = Layer.succeed(EventBus, {
    publish: (ev: any) => Effect.sync(() => { events.push(ev) }),
    subscribe: () => Effect.void,
  } as any)

  const playerLayer = Layer.succeed(PlayerPort, {
    createCharacter: () => Effect.succeed(null as never),
    getPlayer: () => Effect.succeed({ id: "char-1" } as any),
    getPlayerByAccountId: () => Effect.succeed(null),
    allocateStats: () => Effect.void,
    addCurrency: () => Effect.void,
    deductCurrency: () => Effect.void,
  })

  return { repoLayer, defRepoLayer, busLayer, playerLayer, events }
}

describe("Inventory Concurrency", () => {
  it("should prevent duplicate item usage under concurrent load due to locking", async () => {
    const { repoLayer, defRepoLayer, busLayer, playerLayer, events } = makeInventoryTestMocks()
    const cacheLayer = makeAtomicCacheLayer()

    const liveLayer = InventoryPortLive.pipe(
      Layer.provide(Layer.mergeAll(repoLayer, defRepoLayer, playerLayer)),
      Layer.provideMerge(InventoryLockLive),
      Layer.provide(cacheLayer),
      Layer.provide(busLayer),
    )

    // Fire 10 concurrent useItem requests for a single consumable item.
    // Without locking, the simulated DB latency allows all 10 to read quantity=1,
    // and all 10 successfully "use" the item, creating duplicate events.
    // With InventoryLock, the first request acquires the lock, while the other 9
    // immediately fail to acquire it, throwing an InventoryLockError.
    const concurrentEffects = Array.from({ length: 10 }).map(() =>
      Effect.gen(function* () {
        const port = yield* InventoryPort
        return yield* port.useItem("char-100", "slot-1" as ItemId)
      })
    )

    const exits = await Effect.runPromise(
      Effect.all(concurrentEffects, { concurrency: "unbounded", mode: "either" }).pipe(
        Effect.provide(liveLayer)
      )
    )

    const successes = exits.filter((e) => e._tag === "Right").length
    const failures = exits.filter((e) => e._tag === "Left").length

    expect(successes).toBe(1) // Only one item use should succeed
    expect(failures).toBe(9) // The rest should fail to acquire lock (or fail item requirements if sequential)

    // Also assert that exactly 1 domain event was published
    expect(events.length).toBe(1)
    expect(events[0]._tag).toBe("ItemUsed")
  })
})
