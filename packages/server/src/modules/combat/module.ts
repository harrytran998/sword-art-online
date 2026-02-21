import { Layer } from "effect"
import { CombatPortLive } from "./adapters/inbound/combat-port.live"
import { PgSkillRepositoryLive } from "./adapters/outbound/pg-skill.repository"
import { PgSkillSlotRepositoryLive } from "./adapters/outbound/pg-skill-slot.repository"
import { RedisCooldownRepositoryLive } from "./adapters/outbound/redis-cooldown.repository"

const CombatRepositoriesLive = Layer.mergeAll(
  PgSkillRepositoryLive,
  PgSkillSlotRepositoryLive,
  RedisCooldownRepositoryLive,
)

export const CombatModule = CombatPortLive.pipe(
  Layer.provideMerge(CombatRepositoriesLive),
)
