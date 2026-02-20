export interface RespawnTimerProps {
  readonly spawnPointId: number
  readonly nextSpawnAt: Date
}

export class RespawnTimer {
  private constructor(private readonly props: RespawnTimerProps) {}

  static create(spawnPointId: number, delayMs: number): RespawnTimer {
    return new RespawnTimer({
      spawnPointId,
      nextSpawnAt: new Date(Date.now() + delayMs),
    })
  }

  static fromNextSpawnAt(spawnPointId: number, nextSpawnAt: Date): RespawnTimer {
    return new RespawnTimer({ spawnPointId, nextSpawnAt })
  }

  get spawnPointId(): number { return this.props.spawnPointId }
  get nextSpawnAt(): Date { return this.props.nextSpawnAt }

  shouldRespawn(now: Date = new Date()): boolean {
    return now >= this.props.nextSpawnAt
  }

  remainingMs(now: Date = new Date()): number {
    return Math.max(0, this.props.nextSpawnAt.getTime() - now.getTime())
  }
}
