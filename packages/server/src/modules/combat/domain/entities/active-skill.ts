import type { PlayerId } from "../../../../shared/kernel/types"
import type { SkillPhase } from "./sword-skill"

export interface ActiveSkillProps {
  readonly playerId: PlayerId
  readonly skillId: number
  readonly phase: SkillPhase
  readonly startedAt: number
  readonly targetId?: string
}

export class ActiveSkill {
  private constructor(private readonly props: ActiveSkillProps) {}

  static create(props: ActiveSkillProps): ActiveSkill {
    return new ActiveSkill(props)
  }

  get playerId(): PlayerId { return this.props.playerId }
  get skillId(): number { return this.props.skillId }
  get phase(): SkillPhase { return this.props.phase }
  get startedAt(): number { return this.props.startedAt }
  get targetId(): string | undefined { return this.props.targetId }

  getElapsedMs(now: number): number {
    return now - this.props.startedAt
  }

  withPhase(phase: SkillPhase): ActiveSkill {
    return ActiveSkill.create({ ...this.props, phase })
  }
}
