import { Effect, Layer } from "effect"
import { SkillSlotRepository } from "../../ports/outbound/skill-slot.repository"
import { DatabaseService } from "../../../../shared/infrastructure/database/index"
import type { PlayerId } from "../../../../shared/kernel/types"

export const PgSkillSlotRepositoryLive = Layer.effect(
  SkillSlotRepository,
  Effect.gen(function* () {
    const db = yield* DatabaseService

    return {
      getSkillsForCharacter: (characterId: PlayerId) =>
        Effect.tryPromise(() =>
          db.kysely
            .selectFrom("sao.character_skills")
            .selectAll()
            .where("character_id", "=", characterId)
            .execute(),
        ).pipe(
          Effect.map((rows) =>
            rows.map((r) => ({
              characterId: r.character_id,
              skillId: r.skill_id,
              level: r.level,
              proficiency: r.proficiency,
              slotIndex: r.slot_index,
            })),
          ),
          Effect.orDie,
        ),

      getCharacterSkill: (characterId: PlayerId, skillId: number) =>
        Effect.tryPromise(() =>
          db.kysely
            .selectFrom("sao.character_skills")
            .selectAll()
            .where("character_id", "=", characterId)
            .where("skill_id", "=", skillId)
            .executeTakeFirst(),
        ).pipe(
          Effect.map((row) =>
            row
              ? {
                  characterId: row.character_id,
                  skillId: row.skill_id,
                  level: row.level,
                  proficiency: row.proficiency,
                  slotIndex: row.slot_index,
                }
              : null,
          ),
          Effect.orDie,
        ),

      updateProficiency: (characterId: PlayerId, skillId: number, newProficiency: number) =>
        Effect.tryPromise(() =>
          db.kysely
            .updateTable("sao.character_skills")
            .set({ proficiency: newProficiency })
            .where("character_id", "=", characterId)
            .where("skill_id", "=", skillId)
            .execute(),
        ).pipe(Effect.asVoid, Effect.orDie),

      assignSlot: (characterId: PlayerId, skillId: number, slotIndex: number) =>
        Effect.gen(function* () {
          // Clear any existing skill in this slot
          yield* Effect.tryPromise(() =>
            db.kysely
              .updateTable("sao.character_skills")
              .set({ slot_index: null })
              .where("character_id", "=", characterId)
              .where("slot_index", "=", slotIndex)
              .execute(),
          ).pipe(Effect.asVoid, Effect.orDie)

          // Assign the skill to the slot
          yield* Effect.tryPromise(() =>
            db.kysely
              .updateTable("sao.character_skills")
              .set({ slot_index: slotIndex })
              .where("character_id", "=", characterId)
              .where("skill_id", "=", skillId)
              .execute(),
          ).pipe(Effect.asVoid, Effect.orDie)
        }),

      clearSlot: (characterId: PlayerId, slotIndex: number) =>
        Effect.tryPromise(() =>
          db.kysely
            .updateTable("sao.character_skills")
            .set({ slot_index: null })
            .where("character_id", "=", characterId)
            .where("slot_index", "=", slotIndex)
            .execute(),
        ).pipe(Effect.asVoid, Effect.orDie),

      insertCharacterSkill: (characterId: PlayerId, skillId: number) =>
        Effect.tryPromise(() =>
          db.kysely
            .insertInto("sao.character_skills")
            .values({
              character_id: characterId,
              skill_id: skillId,
              level: 1,
              proficiency: 0,
              slot_index: null,
            })
            .execute(),
        ).pipe(Effect.asVoid, Effect.orDie),
    }
  }),
)
