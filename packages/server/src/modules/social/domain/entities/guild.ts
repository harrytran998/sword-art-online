import type { GuildId, PlayerId } from "../../../../shared/kernel/types"

export interface Guild {
  readonly id: GuildId
  readonly leaderId: PlayerId
  readonly name: string
  readonly createdAt: number
}
