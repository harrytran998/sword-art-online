import type { PlayerId } from "../../../../shared/kernel/types"
import type { ChatChannel } from "../value-objects/chat-channel"

export interface ChatMessageEntity {
  readonly senderId: PlayerId
  readonly channel: ChatChannel
  readonly message: string
  readonly timestamp: number
}
