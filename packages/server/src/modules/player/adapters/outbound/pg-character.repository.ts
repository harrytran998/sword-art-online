import { Effect, Layer } from "effect"
import { CharacterRepository } from "../../ports/outbound/character.repository"
import { DatabaseService } from "../../../../shared/infrastructure/database/index"
import { Character } from "../../domain/entities/character"
import type { CharacterStats } from "../../domain/value-objects/stats"
import type { PlayerId, AccountId } from "../../../../shared/kernel/types"

interface CharacterRow {
  id: string
  account_id: string
  name: string
  level: number
  experience: number
  current_hp: number
  max_hp: number
  current_floor: number
  col: number
  is_alive: boolean
}

interface StatsRow {
  str: number
  agi: number
  vit: number
  dex: number
  int: number
  lck: number
  unallocated_points: number
}

const toCharacter = (row: CharacterRow, statsRow: StatsRow): Character =>
  Character.create({
    id: row.id as PlayerId,
    accountId: row.account_id as AccountId,
    name: row.name,
    level: row.level,
    experience: row.experience,
    currentHp: row.current_hp,
    maxHp: row.max_hp,
    currentFloor: row.current_floor,
    col: row.col,
    isAlive: row.is_alive,
    stats: {
      str: statsRow.str,
      agi: statsRow.agi,
      vit: statsRow.vit,
      dex: statsRow.dex,
      int: statsRow.int,
      lck: statsRow.lck,
      unallocatedPoints: statsRow.unallocated_points,
    },
  })

const DEFAULT_STATS: StatsRow = {
  str: 5,
  agi: 5,
  vit: 5,
  dex: 5,
  int: 5,
  lck: 5,
  unallocated_points: 0,
}

export const PgCharacterRepositoryLive = Layer.effect(
  CharacterRepository,
  Effect.gen(function* () {
    const db = yield* DatabaseService

    const findStatsForCharacter = (characterId: string) =>
      Effect.tryPromise(() =>
        db.kysely
          .selectFrom("sao.character_stats")
          .selectAll()
          .where("character_id", "=", characterId)
          .executeTakeFirst(),
      ).pipe(Effect.map((row) => row ?? DEFAULT_STATS), Effect.orDie)

    const findCharacterWithStats = (
      characterRow: CharacterRow | undefined,
    ) => {
      if (!characterRow) return Effect.succeed(null)
      return Effect.gen(function* () {
        const statsRow = yield* findStatsForCharacter(characterRow.id)
        return toCharacter(characterRow, statsRow)
      })
    }

    return {
      findById: (id: PlayerId) =>
        Effect.gen(function* () {
          const row = yield* Effect.tryPromise(() =>
            db.kysely
              .selectFrom("sao.characters")
              .selectAll()
              .where("id", "=", id)
              .executeTakeFirst(),
          ).pipe(Effect.orDie)
          return yield* findCharacterWithStats(row)
        }),

      findByName: (name: string) =>
        Effect.gen(function* () {
          const row = yield* Effect.tryPromise(() =>
            db.kysely
              .selectFrom("sao.characters")
              .selectAll()
              .where("name", "=", name)
              .executeTakeFirst(),
          ).pipe(Effect.orDie)
          return yield* findCharacterWithStats(row)
        }),

      findByAccountId: (accountId: AccountId) =>
        Effect.gen(function* () {
          const row = yield* Effect.tryPromise(() =>
            db.kysely
              .selectFrom("sao.characters")
              .selectAll()
              .where("account_id", "=", accountId)
              .executeTakeFirst(),
          ).pipe(Effect.orDie)
          return yield* findCharacterWithStats(row)
        }),

      save: (character: Character) =>
        Effect.tryPromise(() =>
          db.kysely
            .insertInto("sao.characters")
            .values({
              id: character.id,
              account_id: character.accountId,
              name: character.name,
              level: character.level,
              experience: character.experience,
              current_hp: character.currentHp,
              max_hp: character.maxHp,
              current_floor: character.currentFloor,
              col: character.col,
              is_alive: character.isAlive,
            })
            .execute(),
        ).pipe(Effect.asVoid, Effect.orDie),

      update: (character: Character) =>
        Effect.tryPromise(() =>
          db.kysely
            .updateTable("sao.characters")
            .set({
              level: character.level,
              experience: character.experience,
              current_hp: character.currentHp,
              max_hp: character.maxHp,
              current_floor: character.currentFloor,
              col: character.col,
              is_alive: character.isAlive,
            })
            .where("id", "=", character.id)
            .execute(),
        ).pipe(Effect.asVoid, Effect.orDie),

      saveStats: (characterId: PlayerId, stats: CharacterStats) =>
        Effect.tryPromise(() =>
          db.kysely
            .insertInto("sao.character_stats")
            .values({
              character_id: characterId,
              str: stats.str,
              agi: stats.agi,
              vit: stats.vit,
              dex: stats.dex,
              int: stats.int,
              lck: stats.lck,
              unallocated_points: stats.unallocatedPoints,
            })
            .onConflict((oc) =>
              oc.column("character_id").doUpdateSet({
                str: stats.str,
                agi: stats.agi,
                vit: stats.vit,
                dex: stats.dex,
                int: stats.int,
                lck: stats.lck,
                unallocated_points: stats.unallocatedPoints,
              }),
            )
            .execute(),
        ).pipe(Effect.asVoid, Effect.orDie),

      updateExperienceAndLevel: (
        characterId: PlayerId,
        experience: number,
        level: number,
        unallocatedPoints: number,
        maxHp: number,
      ) =>
        Effect.gen(function* () {
          yield* Effect.tryPromise(() =>
            db.kysely
              .updateTable("sao.characters")
              .set({
                experience,
                level,
                max_hp: maxHp,
              })
              .where("id", "=", characterId)
              .execute(),
          ).pipe(Effect.asVoid, Effect.orDie)

          yield* Effect.tryPromise(() =>
            db.kysely
              .updateTable("sao.character_stats")
              .set({
                unallocated_points: unallocatedPoints,
              })
              .where("character_id", "=", characterId)
              .execute(),
          ).pipe(Effect.asVoid, Effect.orDie)
        }),
    }
  }),
)

