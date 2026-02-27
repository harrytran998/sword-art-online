import { GuildId } from "../../../../shared/kernel/types"

export const createGuildId = (): GuildId =>
  GuildId(`guild_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`)
