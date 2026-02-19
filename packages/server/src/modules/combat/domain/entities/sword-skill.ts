import type { WeaponType } from "../../../../shared/infrastructure/database/types"

export type SkillPhase = "idle" | "pre_motion" | "execution" | "post_motion" | "cooldown"

export interface SwordSkillProps {
  readonly id: number
  readonly name: string
  readonly weaponType: WeaponType
  readonly levelReq: number
  readonly hits: number
  readonly damageMultiplier: number
  readonly mpCost: number
  readonly cooldownMs: number
  readonly range: number
  readonly preMotionMs: number
  readonly executionMs: number
  readonly postMotionMs: number
}

export class SwordSkill {
  private constructor(private readonly props: SwordSkillProps) {}

  static create(props: SwordSkillProps): SwordSkill {
    return new SwordSkill(props)
  }

  get id(): number { return this.props.id }
  get name(): string { return this.props.name }
  get weaponType(): WeaponType { return this.props.weaponType }
  get levelReq(): number { return this.props.levelReq }
  get hits(): number { return this.props.hits }
  get damageMultiplier(): number { return this.props.damageMultiplier }
  get mpCost(): number { return this.props.mpCost }
  get cooldownMs(): number { return this.props.cooldownMs }
  get range(): number { return this.props.range }
  get preMotionMs(): number { return this.props.preMotionMs }
  get executionMs(): number { return this.props.executionMs }
  get postMotionMs(): number { return this.props.postMotionMs }

  getTotalDuration(): number {
    return this.props.preMotionMs + this.props.executionMs + this.props.postMotionMs
  }

  getPhaseAt(elapsedMs: number): SkillPhase {
    if (elapsedMs < this.props.preMotionMs) return "pre_motion"
    if (elapsedMs < this.props.preMotionMs + this.props.executionMs) return "execution"
    if (elapsedMs < this.getTotalDuration()) return "post_motion"
    return "cooldown"
  }
}
