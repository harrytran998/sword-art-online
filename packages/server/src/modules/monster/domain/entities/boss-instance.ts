import type { MonsterId, ZoneId, PlayerId } from "../../../../shared/kernel/types"

export type BossPhase = 1 | 2 | 3

export interface BossInstanceProps {
  readonly id: MonsterId
  readonly definitionId: number
  readonly name: string
  readonly zoneId: ZoneId
  readonly totalHp: number
  readonly currentHp: number
  readonly hpPerBar: number
  readonly phase: BossPhase
  readonly attack: number
  readonly defense: number
  readonly level: number
  readonly isSealed: boolean
  readonly isDefeated: boolean
  readonly aggroTarget: PlayerId | null
  readonly summonIds: readonly MonsterId[]
  readonly positionX: number
  readonly positionY: number
  readonly positionZ: number
  readonly enrageStartedAt: number | null
}

const HP_PER_BAR = 5000
const TOTAL_BARS = 3

export class BossInstance {
  private constructor(private readonly props: BossInstanceProps) {}

  static create(props: Omit<BossInstanceProps, "hpPerBar">): BossInstance {
    return new BossInstance({ ...props, hpPerBar: HP_PER_BAR })
  }

  static createIllfang(id: MonsterId, zoneId: ZoneId): BossInstance {
    return BossInstance.create({
      id,
      definitionId: 0, // Will be set from DB
      name: "Illfang the Kobold Lord",
      zoneId,
      totalHp: HP_PER_BAR * TOTAL_BARS,
      currentHp: HP_PER_BAR * TOTAL_BARS,
      phase: 1,
      attack: 120,
      defense: 80,
      level: 15,
      isSealed: false,
      isDefeated: false,
      aggroTarget: null,
      summonIds: [],
      positionX: 50,
      positionY: 0,
      positionZ: 80,
      enrageStartedAt: null,
    })
  }

  get id(): MonsterId { return this.props.id }
  get name(): string { return this.props.name }
  get zoneId(): ZoneId { return this.props.zoneId }
  get totalHp(): number { return this.props.totalHp }
  get currentHp(): number { return this.props.currentHp }
  get hpPerBar(): number { return this.props.hpPerBar }
  get phase(): BossPhase { return this.props.phase }
  get attack(): number { return this.props.attack }
  get defense(): number { return this.props.defense }
  get level(): number { return this.props.level }
  get isSealed(): boolean { return this.props.isSealed }
  get isDefeated(): boolean { return this.props.isDefeated }
  get aggroTarget(): PlayerId | null { return this.props.aggroTarget }
  get summonIds(): readonly MonsterId[] { return this.props.summonIds }
  get positionX(): number { return this.props.positionX }
  get positionY(): number { return this.props.positionY }
  get positionZ(): number { return this.props.positionZ }
  get enrageStartedAt(): number | null { return this.props.enrageStartedAt }

  isAlive(): boolean {
    return this.props.currentHp > 0 && !this.props.isDefeated
  }

  getCurrentBarHp(): number {
    const barsRemaining = 3 - this.props.phase + 1
    const hpThreshold = (barsRemaining - 1) * this.props.hpPerBar
    return Math.max(0, this.props.currentHp - hpThreshold)
  }

  /**
   * Returns the phase based on current HP:
   * Phase 1: HP > 10000 (bars 2+3 full)
   * Phase 2: HP > 5000 (bar 3 full)
   * Phase 3: HP <= 5000
   */
  getPhaseFromHp(): BossPhase {
    if (this.props.currentHp > 2 * this.props.hpPerBar) return 1
    if (this.props.currentHp > this.props.hpPerBar) return 2
    return 3
  }

  shouldTransitionPhase(): boolean {
    return this.getPhaseFromHp() !== this.props.phase
  }

  isEnraged(): boolean {
    return this.props.phase === 3
  }

  takeDamage(damage: number): BossInstance {
    const newHp = Math.max(0, this.props.currentHp - damage)

    let newPhase: BossPhase
    if (newHp > 2 * this.props.hpPerBar) {
      newPhase = 1
    } else if (newHp > this.props.hpPerBar) {
      newPhase = 2
    } else {
      newPhase = 3
    }

    return new BossInstance({
      ...this.props,
      currentHp: newHp,
      phase: newPhase,
      isDefeated: newHp <= 0,
      enrageStartedAt: newPhase === 3 && this.props.phase !== 3
        ? Date.now()
        : this.props.enrageStartedAt,
    })
  }

  withSeal(sealed: boolean): BossInstance {
    return new BossInstance({ ...this.props, isSealed: sealed })
  }

  withAggroTarget(target: PlayerId | null): BossInstance {
    return new BossInstance({ ...this.props, aggroTarget: target })
  }

  withSummons(summonIds: readonly MonsterId[]): BossInstance {
    return new BossInstance({ ...this.props, summonIds })
  }

  withPosition(x: number, y: number, z: number): BossInstance {
    return new BossInstance({
      ...this.props,
      positionX: x,
      positionY: y,
      positionZ: z,
    })
  }

  /**
   * Phase-specific attack parameters
   */
  getPhaseAttackMultiplier(): number {
    switch (this.props.phase) {
      case 1: return 1
      case 2: return 1.5
      case 3: return 2
    }
  }

  getPhaseAttackSpeed(): number {
    switch (this.props.phase) {
      case 1: return 3000 // 3s between attacks
      case 2: return 2000 // 2s (faster)
      case 3: return 1000 // 1s (enrage)
    }
  }

  getPhaseAoeRadius(): number {
    switch (this.props.phase) {
      case 1: return 5
      case 2: return 8  // wider AoE
      case 3: return 15 // room-wide
    }
  }
}
