export type AttackPatternType = "melee" | "charge" | "aoe"

export interface AttackPatternProps {
  readonly type: AttackPatternType
  readonly damageMultiplier: number
  readonly range: number
  readonly cooldownMs: number
  readonly telegraphMs: number
  readonly aoeRadius?: number
}

export class AttackPattern {
  private constructor(private readonly props: AttackPatternProps) {}

  static create(props: AttackPatternProps): AttackPattern {
    return new AttackPattern(props)
  }

  static melee(): AttackPattern {
    return new AttackPattern({
      type: "melee",
      damageMultiplier: 1.0,
      range: 2.0,
      cooldownMs: 1500,
      telegraphMs: 0,
    })
  }

  static charge(): AttackPattern {
    return new AttackPattern({
      type: "charge",
      damageMultiplier: 1.5,
      range: 10.0,
      cooldownMs: 5000,
      telegraphMs: 1000,
    })
  }

  static aoe(radius: number = 5.0): AttackPattern {
    return new AttackPattern({
      type: "aoe",
      damageMultiplier: 0.8,
      range: 3.0,
      cooldownMs: 8000,
      telegraphMs: 2000,
      aoeRadius: radius,
    })
  }

  get type(): AttackPatternType { return this.props.type }
  get damageMultiplier(): number { return this.props.damageMultiplier }
  get range(): number { return this.props.range }
  get cooldownMs(): number { return this.props.cooldownMs }
  get telegraphMs(): number { return this.props.telegraphMs }
  get aoeRadius(): number | undefined { return this.props.aoeRadius }

  isTelegraphed(): boolean {
    return this.props.telegraphMs > 0
  }
}
