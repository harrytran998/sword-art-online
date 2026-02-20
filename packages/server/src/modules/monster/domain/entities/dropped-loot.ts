import type { ZoneId, PlayerId } from "../../../../shared/kernel/types"

export interface DroppedLootProps {
  readonly id: string
  readonly itemName: string
  readonly quantity: number
  readonly positionX: number
  readonly positionY: number
  readonly positionZ: number
  readonly zoneId: ZoneId
  readonly killerId: PlayerId
  readonly droppedAt: Date
  readonly protectionExpiresAt: Date
}

export class DroppedLoot {
  private constructor(private readonly props: DroppedLootProps) {}

  static create(props: DroppedLootProps): DroppedLoot {
    return new DroppedLoot(props)
  }

  static drop(
    id: string,
    itemName: string,
    quantity: number,
    x: number,
    y: number,
    z: number,
    zoneId: ZoneId,
    killerId: PlayerId,
    protectionMs: number = 30000,
  ): DroppedLoot {
    const now = new Date()
    return new DroppedLoot({
      id,
      itemName,
      quantity,
      positionX: x,
      positionY: y,
      positionZ: z,
      zoneId,
      killerId,
      droppedAt: now,
      protectionExpiresAt: new Date(now.getTime() + protectionMs),
    })
  }

  get id(): string { return this.props.id }
  get itemName(): string { return this.props.itemName }
  get quantity(): number { return this.props.quantity }
  get positionX(): number { return this.props.positionX }
  get positionY(): number { return this.props.positionY }
  get positionZ(): number { return this.props.positionZ }
  get zoneId(): ZoneId { return this.props.zoneId }
  get killerId(): PlayerId { return this.props.killerId }
  get droppedAt(): Date { return this.props.droppedAt }
  get protectionExpiresAt(): Date { return this.props.protectionExpiresAt }

  isProtected(playerId: PlayerId, now: Date = new Date()): boolean {
    if (now >= this.props.protectionExpiresAt) return false
    return this.props.killerId !== playerId
  }

  canPickup(playerId: PlayerId, now: Date = new Date()): boolean {
    return !this.isProtected(playerId, now)
  }

  isExpired(now: Date = new Date(), expireMs: number = 300000): boolean {
    return now.getTime() - this.props.droppedAt.getTime() > expireMs
  }

  distanceTo(x: number, z: number): number {
    const dx = this.props.positionX - x
    const dz = this.props.positionZ - z
    return Math.sqrt(dx * dx + dz * dz)
  }

  isInRange(x: number, z: number, range: number = 2.0): boolean {
    return this.distanceTo(x, z) <= range
  }
}
