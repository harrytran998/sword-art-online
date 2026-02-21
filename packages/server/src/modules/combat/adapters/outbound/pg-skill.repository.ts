import { Effect, Layer } from "effect"
import { SkillRepository } from "../../ports/outbound/skill.repository"
import { DatabaseService } from "../../../../shared/infrastructure/database/index"
import { SwordSkill } from "../../domain/entities/sword-skill"
import type { PlayerId } from "../../../../shared/kernel/types"
import type { WeaponType } from "../../../../shared/infrastructure/database/types"

export const PgSkillRepositoryLive = Layer.effect(
  SkillRepository,
  Effect.gen(function* () {
    const db = yield* DatabaseService

    return {
      getSkillById: (id: number) =>
        Effect.tryPromise(() =>
          db.kysely
            .selectFrom("sao.skill_definitions")
            .selectAll()
            .where("id", "=", id)
            .executeTakeFirst(),
        ).pipe(
          Effect.map((row) =>
            row
              ? SwordSkill.create({
                  id: row.id,
                  name: row.name,
                  weaponType: row.weapon_type as WeaponType,
                  levelReq: row.level_req,
                  hits: row.hits,
                  damageMultiplier: row.damage_multiplier,
                  mpCost: row.mp_cost,
                  cooldownMs: row.cooldown_ms,
                  range: row.range,
                  preMotionMs: row.pre_motion_ms,
                  executionMs: row.execution_ms,
                  postMotionMs: row.post_motion_ms,
                })
              : null,
          ),
          Effect.orDie,
        ),

      getSkillsByWeaponType: (weaponType: WeaponType) =>
        Effect.tryPromise(() =>
          db.kysely
            .selectFrom("sao.skill_definitions")
            .selectAll()
            .where("weapon_type", "=", weaponType)
            .execute(),
        ).pipe(
          Effect.map((rows) =>
            rows.map((row) =>
              SwordSkill.create({
                id: row.id,
                name: row.name,
                weaponType: row.weapon_type as WeaponType,
                levelReq: row.level_req,
                hits: row.hits,
                damageMultiplier: row.damage_multiplier,
                mpCost: row.mp_cost,
                cooldownMs: row.cooldown_ms,
                range: row.range,
                preMotionMs: row.pre_motion_ms,
                executionMs: row.execution_ms,
                postMotionMs: row.post_motion_ms,
              }),
            ),
          ),
          Effect.orDie,
        ),

      getCharacterSkills: (characterId: PlayerId) =>
        Effect.tryPromise(() =>
          db.kysely
            .selectFrom("sao.character_skills")
            .selectAll()
            .where("character_id", "=", characterId)
            .execute(),
        ).pipe(
          Effect.map((rows) =>
            rows.map((r) => ({
              skillId: r.skill_id,
              level: r.level,
              proficiency: r.proficiency,
              slotIndex: r.slot_index,
            })),
          ),
          Effect.orDie,
        ),
    }
  }),
)
