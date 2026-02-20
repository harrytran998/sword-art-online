import type { MonsterId, PlayerId } from "../../../../shared/kernel/types"
import type { AttackPatternType } from "../value-objects/attack-pattern"

export interface MonsterAttackProps {
  readonly id: string
  readonly monsterId: MonsterId
  readonly attackType: AttackPatternType
  readonly targetId: PlayerId | null
  readonly targetPositionX: number
  readonly targetPositionY: number
  readonly targetPositionZ: number
  readonly startedAt: Date
  readonly executeAt: Date
  readonly damageMultiplier: number
  readonly aoeRadius: number | null
}

export class MonsterAttack {
  private constructor(private readonly props: MonsterAttackProps) {}

  static create(props: MonsterAttackProps): MonsterAttack {
    return new MonsterAttack(props)
  }

  static startTelegraph(
    id: string,
    monsterId: MonsterId,
    attackType: AttackPatternType,
    targetId: PlayerId | null,
    targetX: number,
    targetY: number,
    targetZ: number,
    telegraphMs: number,
    damageMultiplier: number,
    aoeRadius: number | null,
  ): MonsterAttack {
    const now = new Date()
    return new MonsterAttack({
      id,
      monsterId,
      attackType,
      targetId,
      targetPositionX: targetX,
      targetPositionY: targetY,
      targetPositionZ: targetZ,
      startedAt: now,
      executeAt: new Date(now.getTime() + telegraphMs),
      damageMultiplier,
      aoeRadius,
    })
  }

  get id(): string { return this.props.id }
  get monsterId(): MonsterId { return this.props.monsterId }
  get attackType(): AttackPatternType { return this.props.attackType }
  get targetId(): PlayerId | null { return this.props.targetId }
  get targetPositionX(): number { return this.props.targetPositionX }
  get targetPositionY(): number { return this.props.targetPositionY }
  get targetPositionZ(): number { return this.props.targetPositionZ }
  get startedAt(): Date { return this.props.startedAt }
  get executeAt(): Date { return this.props.executeAt }
  get damageMultiplier(): number { return this.props.damageMultiplier }
  get aoeRadius(): number | null { return this.props.aoeRadius }

  isTelegraphed(now: Date = new Date()): boolean {
    return now < this.props.executeAt
  }

  isReady(now: Date = new Date()): boolean {
    return now >= this.props.executeAt
  }

  getTargetArea(): { x: number; y: number; z: number; radius: number } {
    return {
      x: this.props.targetPositionX,
      y: this.props.targetPositionY,
      z: this.props.targetPositionZ,
      radius: this.props.aoeRadius ?? 1.0,
    }
  }
}
