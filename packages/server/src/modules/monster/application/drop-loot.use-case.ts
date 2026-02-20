import { Effect } from "effect"
import type { MonsterId, PlayerId } from "../../../shared/kernel/types"
import { MonsterRepository, LootTableRepository } from "../ports/outbound/monster.repository"
import { MonsterNotFoundError } from "../domain/errors"
import { EventBus } from "../../../shared/infrastructure/event-bus/index"
import { LootDropped } from "../events/published"

export interface DroppedLoot {
  readonly itemName: string
  readonly quantity: number
}

export interface DropLootResult {
  readonly monsterId: MonsterId
  readonly positionX: number
  readonly positionY: number
  readonly positionZ: number
  readonly loot: DroppedLoot[]
  readonly col: number
  readonly experience: number
  readonly killerId: PlayerId
}

export const dropLoot = (
  monsterId: MonsterId,
  killerId: PlayerId,
): Effect.Effect<DropLootResult, MonsterNotFoundError, MonsterRepository | LootTableRepository | EventBus> =>
  Effect.gen(function* () {
    const monsterRepo = yield* MonsterRepository
    const lootRepo = yield* LootTableRepository
    const eventBus = yield* EventBus

    const monster = yield* monsterRepo.getMonsterById(monsterId)
    if (!monster) {
      return yield* Effect.fail(new MonsterNotFoundError(monsterId))
    }

    const loot: DroppedLoot[] = []
    let col = 0
    const expReward = monster.level * 10

    if (monster.definitionId) {
      const lootTable = yield* lootRepo.getLootTableById(monster.definitionId)
      if (lootTable) {
        const rolledItems = lootTable.rollLoot()
        for (const item of rolledItems) {
          loot.push({ itemName: item.item, quantity: item.quantity })
        }
        col = Math.floor(Math.random() * (monster.level * 10 - monster.level * 5 + 1)) + monster.level * 5
      }
    }

    const result: DropLootResult = {
      monsterId,
      positionX: monster.positionX,
      positionY: monster.positionY,
      positionZ: monster.positionZ,
      loot,
      col,
      experience: expReward,
      killerId,
    }

    const itemNames = loot.map((l) => `${l.itemName}x${l.quantity}`)
    yield* eventBus.publish(
      new LootDropped({
        timestamp: new Date(),
        aggregateId: monsterId,
        monsterId,
        items: itemNames,
      }),
    )

    return result
  })
