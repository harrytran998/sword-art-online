import { Effect } from "effect"
import { isValidClassId } from "@sao/shared"
import { Character } from "../domain/entities/character"
import { CharacterName } from "../domain/value-objects/character-name"
import { getStartingStats } from "../domain/value-objects/stats"
import {
  CharacterNameTakenError,
  InvalidCharacterNameError,
  InvalidClassIdError,
} from "../domain/errors"
import { CharacterRepository } from "../ports/outbound/character.repository"
import { EventBus } from "../../../shared/infrastructure/event-bus/index"
import { PlayerCreated } from "../events/published"
import type { CreateCharacterParams } from "../ports/inbound/player.port"
import type { PlayerId } from "../../../shared/kernel/types"

export const createCharacter = (params: CreateCharacterParams) =>
  Effect.gen(function* () {
    const repo = yield* CharacterRepository
    const eventBus = yield* EventBus

    const validName = CharacterName.create(params.name)
    if (!validName) {
      return yield* Effect.fail(
        new InvalidCharacterNameError({ name: params.name }),
      )
    }

    if (!isValidClassId(params.classId)) {
      return yield* Effect.fail(
        new InvalidClassIdError({ classId: params.classId }),
      )
    }

    const existing = yield* repo.findByName(validName.value)
    if (existing) {
      return yield* Effect.fail(
        new CharacterNameTakenError({ name: params.name }),
      )
    }

    const stats = getStartingStats(params.classId)
    const baseHp = 100 + stats.vit * 10

    const character = Character.create({
      id: crypto.randomUUID() as PlayerId,
      accountId: params.accountId,
      name: validName.value,
      level: 1,
      experience: 0,
      currentHp: baseHp,
      maxHp: baseHp,
      currentFloor: 1,
      col: 0,
      isAlive: true,
      stats,
    })

    yield* repo.save(character)
    yield* repo.saveStats(character.id, stats)

    yield* eventBus.publish(new PlayerCreated({
      timestamp: new Date(),
      aggregateId: character.id,
      playerId: character.id,
      name: character.name,
    }))

    return character
  })
