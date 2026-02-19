import { Context, Effect } from "effect"
import type { PlayerId, ZoneId, MonsterId } from "../../../../shared/kernel/types"
import type { Monster, MonsterState } from "../../domain/entities/monster"
import type { MonsterNotFoundError, InvalidTargetError } from "../../domain/errors"

export interface MonsterPort {
  readonly spawnMonster: (spawnPointId: number) => Effect.Effect<Monster, MonsterNotFoundError>
  readonly despawnMonster: (monsterId: MonsterId) => Effect.Effect<void>
  readonly getMonster: (monsterId: MonsterId) => Effect.Effect<Monster, MonsterNotFoundError>
  readonly getMonstersInZone: (zoneId: ZoneId) => Effect.Effect<Monster[]>
  readonly updateMonsterState: (monsterId: MonsterId, state: MonsterState) => Effect.Effect<Monster, MonsterNotFoundError>
  readonly updateMonsterPosition: (
    monsterId: MonsterId,
    x: number,
    y: number,
    z: number,
  ) => Effect.Effect<Monster, MonsterNotFoundError>
  readonly damageMonster: (
    monsterId: MonsterId,
    attackerId: PlayerId,
    damage: number,
  ) => Effect.Effect<Monster, MonsterNotFoundError | InvalidTargetError>
}

export class MonsterPort extends Context.Tag("MonsterPort")<MonsterPort, MonsterPort>() {}
