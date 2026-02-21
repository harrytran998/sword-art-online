import { Context, Effect } from "effect"
import type { PlayerId } from "../../../../shared/kernel/types"

export interface CharacterSkillRecord {
  readonly characterId: string
  readonly skillId: number
  readonly level: number
  readonly proficiency: number
  readonly slotIndex: number | null
}

export class SkillSlotRepository extends Context.Tag("SkillSlotRepository")<
  SkillSlotRepository,
  {
    readonly getSkillsForCharacter: (
      characterId: PlayerId,
    ) => Effect.Effect<CharacterSkillRecord[]>
    readonly getCharacterSkill: (
      characterId: PlayerId,
      skillId: number,
    ) => Effect.Effect<CharacterSkillRecord | null>
    readonly updateProficiency: (
      characterId: PlayerId,
      skillId: number,
      newProficiency: number,
    ) => Effect.Effect<void>
    readonly assignSlot: (
      characterId: PlayerId,
      skillId: number,
      slotIndex: number,
    ) => Effect.Effect<void>
    readonly clearSlot: (
      characterId: PlayerId,
      slotIndex: number,
    ) => Effect.Effect<void>
    readonly insertCharacterSkill: (
      characterId: PlayerId,
      skillId: number,
    ) => Effect.Effect<void>
  }
>() {}
