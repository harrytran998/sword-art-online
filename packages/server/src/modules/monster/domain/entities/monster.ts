import type { MonsterType } from "../../../../shared/infrastructure/database/types"
import type { MonsterId, ZoneId } from "../../../../shared/kernel/types"

export type MonsterState = "idle" | "patrol" | "aggro" | "attack" | "return" | "death"

export interface MonsterProps {
  readonly id: MonsterId
  readonly definitionId: number
  readonly name: string
  readonly monsterType: MonsterType
  readonly level: number
  readonly maxHp: number
  readonly currentHp: number
  readonly attack: number
  readonly defense: number
  readonly zoneId: ZoneId
  readonly positionX: number
  readonly positionY: number
  readonly positionZ: number
  readonly spawnX: number
  readonly spawnY: number
  readonly spawnZ: number
  readonly aggroRange: number
  readonly patrolRange: number
  readonly attackRange: number
  readonly state: MonsterState
  readonly targetId: string | null
}

export class Monster {
  private constructor(private readonly props: MonsterProps) {}

  static create(props: MonsterProps): Monster {
    return new Monster(props)
  }

  get id(): MonsterId { return this.props.id }
  get definitionId(): number { return this.props.definitionId }
  get name(): string { return this.props.name }
  get monsterType(): MonsterType { return this.props.monsterType }
  get level(): number { return this.props.level }
  get maxHp(): number { return this.props.maxHp }
  get currentHp(): number { return this.props.currentHp }
  get attack(): number { return this.props.attack }
  get defense(): number { return this.props.defense }
  get zoneId(): ZoneId { return this.props.zoneId }
  get positionX(): number { return this.props.positionX }
  get positionY(): number { return this.props.positionY }
  get positionZ(): number { return this.props.positionZ }
  get spawnX(): number { return this.props.spawnX }
  get spawnY(): number { return this.props.spawnY }
  get spawnZ(): number { return this.props.spawnZ }
  get aggroRange(): number { return this.props.aggroRange }
  get patrolRange(): number { return this.props.patrolRange }
  get attackRange(): number { return this.props.attackRange }
  get state(): MonsterState { return this.props.state }
  get targetId(): string | null { return this.props.targetId }

  isAlive(): boolean {
    return this.props.currentHp > 0
  }

  isAtSpawn(): boolean {
    const dx = this.props.positionX - this.props.spawnX
    const dz = this.props.positionZ - this.props.spawnZ
    return Math.sqrt(dx * dx + dz * dz) < 1.0
  }

  distanceTo(x: number, z: number): number {
    const dx = this.props.positionX - x
    const dz = this.props.positionZ - z
    return Math.sqrt(dx * dx + dz * dz)
  }

  isInAggroRange(x: number, z: number): boolean {
    return this.distanceTo(x, z) <= this.props.aggroRange
  }

  isInAttackRange(x: number, z: number): boolean {
    return this.distanceTo(x, z) <= this.props.attackRange
  }

  withState(state: MonsterState): Monster {
    return Monster.create({ ...this.props, state })
  }

  withPosition(x: number, y: number, z: number): Monster {
    return Monster.create({ ...this.props, positionX: x, positionY: y, positionZ: z })
  }

  withTarget(targetId: string | null): Monster {
    return Monster.create({ ...this.props, targetId })
  }

  withHp(currentHp: number): Monster {
    return Monster.create({ ...this.props, currentHp: Math.max(0, currentHp) })
  }

  takeDamage(damage: number): Monster {
    return this.withHp(this.props.currentHp - damage)
  }
}
