import type { ClientMessage } from "@sao/shared"

export interface GamePort {
  readonly connect: (url: string, token: string) => void
  readonly disconnect: () => void
  readonly send: (message: ClientMessage) => void
  readonly createCharacter: (name: string, classId: number) => void
  readonly move: (x: number, y: number, z: number, rotation: number) => void
  readonly stopMoving: () => void
  readonly changeZone: (targetZoneId: string) => void
}
