import type { Position } from "./position"

export interface RemotePlayer {
  readonly id: string
  readonly name: string
  readonly level: number
  readonly position: Position
  readonly rotation: number
  readonly animationState: string
}
