import type { Character } from "./character"
import type { Position } from "./position"

export interface LocalPlayer extends Character {
  readonly position: Position
  readonly rotation: number
  readonly velocity: { readonly x: number; readonly y: number; readonly z: number }
}
