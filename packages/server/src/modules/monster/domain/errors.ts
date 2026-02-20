export class MonsterNotFoundError extends Error {
  readonly _tag = "MonsterNotFoundError" as const

  constructor(readonly monsterId: string) {
    super(`Monster not found: ${monsterId}`)
    this.name = "MonsterNotFoundError"
  }
}

export class SpawnPointNotFoundError extends Error {
  readonly _tag = "SpawnPointNotFoundError" as const

  constructor(readonly spawnId: number) {
    super(`Spawn point not found: ${spawnId}`)
    this.name = "SpawnPointNotFoundError"
  }
}

export class InvalidTargetError extends Error {
  readonly _tag = "InvalidTargetError" as const

  constructor(
    readonly targetId: string,
    readonly reason: string,
  ) {
    super(`Invalid target ${targetId}: ${reason}`)
    this.name = "InvalidTargetError"
  }
}
