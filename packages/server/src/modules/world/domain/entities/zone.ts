import type { ZoneId, FloorId } from "../../../../shared/kernel/types"
import type { Position } from "../value-objects/position"
import { type ZoneBounds, zoneBoundsContains } from "../value-objects/zone-bounds"

export type ZoneType = "town" | "field" | "dungeon" | "labyrinth" | "boss"

interface ZoneProps {
  readonly id: ZoneId
  readonly floorId: FloorId
  readonly name: string
  readonly type: ZoneType
  readonly bounds: ZoneBounds
  readonly spawnPoint: Position
  readonly pvpEnabled: boolean
  readonly safeZone: boolean
  readonly maxPlayers: number
}

export class Zone {
  private constructor(private readonly props: ZoneProps) {}

  static create(props: ZoneProps): Zone {
    return new Zone(props)
  }

  get id(): ZoneId {
    return this.props.id
  }
  get floorId(): FloorId {
    return this.props.floorId
  }
  get name(): string {
    return this.props.name
  }
  get type(): ZoneType {
    return this.props.type
  }
  get bounds(): ZoneBounds {
    return this.props.bounds
  }
  get spawnPoint(): Position {
    return this.props.spawnPoint
  }
  get pvpEnabled(): boolean {
    return this.props.pvpEnabled
  }
  get safeZone(): boolean {
    return this.props.safeZone
  }
  get maxPlayers(): number {
    return this.props.maxPlayers
  }

  zoneBoundsContainsPosition(x: number, y: number, z: number): boolean {
    return zoneBoundsContains(this.props.bounds, x, y, z)
  }
}
