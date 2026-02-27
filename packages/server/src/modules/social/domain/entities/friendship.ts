import type { PlayerId } from "../../../../shared/kernel/types"

export interface Friendship {
  readonly requesterId: PlayerId
  readonly accepterId: PlayerId
  readonly createdAt: number
}
