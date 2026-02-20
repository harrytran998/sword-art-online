import type { ZoneId } from "../../../../shared/kernel/types"

export interface SpawnPointProps {
  readonly id: number
  readonly monsterDefId: number
  readonly zoneId: ZoneId
  readonly spawnX: number
  readonly spawnY: number
  readonly spawnZ: number
  readonly spawnCount: number
  readonly spawnRadius: number
  readonly isActive: boolean
}

export class SpawnPoint {
  private constructor(private readonly props: SpawnPointProps) {}

  static create(props: SpawnPointProps): SpawnPoint {
    return new SpawnPoint(props)
  }

  get id(): number { return this.props.id }
  get monsterDefId(): number { return this.props.monsterDefId }
  get zoneId(): ZoneId { return this.props.zoneId }
  get spawnX(): number { return this.props.spawnX }
  get spawnY(): number { return this.props.spawnY }
  get spawnZ(): number { return this.props.spawnZ }
  get spawnCount(): number { return this.props.spawnCount }
  get spawnRadius(): number { return this.props.spawnRadius }
  get isActive(): boolean { return this.props.isActive }

  getRandomSpawnPosition(): { x: number; y: number; z: number } {
    const angle = Math.random() * Math.PI * 2
    const radius = Math.random() * this.props.spawnRadius
    return {
      x: this.props.spawnX + Math.cos(angle) * radius,
      y: this.props.spawnY,
      z: this.props.spawnZ + Math.sin(angle) * radius,
    }
  }
}
