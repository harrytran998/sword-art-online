import { Context, Effect } from "effect"
import type { PlayerId } from "../../../../shared/kernel/types"
import type { WeaponType } from "../../../../shared/infrastructure/database/types"
import type { SwordSkill } from "../../domain/entities/sword-skill"

export interface CharacterSkill {
  readonly skillId: number
  readonly level: number
  readonly proficiency: number
  readonly slotIndex: number | null
}

export class SkillRepository extends Context.Tag("SkillRepository")<
  SkillRepository,
  {
    readonly getSkillById: (id: number) => Effect.Effect<SwordSkill | null>
    readonly getSkillsByWeaponType: (weaponType: WeaponType) => Effect.Effect<SwordSkill[]>
    readonly getCharacterSkills: (characterId: PlayerId) => Effect.Effect<CharacterSkill[]>
  }
>() {}
