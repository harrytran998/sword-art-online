import { Effect } from "effect"
import { isValidClassId } from "@sao/shared"
import { Character } from "../domain/entities/character.js"
import { CharacterName } from "../domain/value-objects/character-name.js"
import { getStartingStats } from "../domain/value-objects/stats.js"
import {
  CharacterNameTakenError,
  InvalidCharacterNameError,
  InvalidClassIdError,
} from "../domain/errors.js"
import { CharacterRepository } from "../ports/outbound/character.repository.js"
import { EventBus } from "../../../shared/infrastructure/event-bus/index.js"
import { createEvent } from "../../../shared/kernel/events.js"
import type { CreateCharacterParams } from "../ports/inbound/player.port.js"
import type { PlayerId } from "../../../shared/kernel/types.js"

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

    yield* eventBus.publish(createEvent("PlayerCreated", character.id))

    return character
  })
