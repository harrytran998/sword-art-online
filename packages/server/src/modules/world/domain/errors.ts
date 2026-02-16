import { Data } from "effect"

export class ZoneNotFoundError extends Data.TaggedError("ZoneNotFoundError")<{
  readonly zoneId: string
}> {}

export class FloorLockedError extends Data.TaggedError("FloorLockedError")<{
  readonly floorId: number
}> {}

export class InvalidPositionError extends Data.TaggedError("InvalidPositionError")<{
  readonly x: number
  readonly y: number
  readonly z: number
  readonly reason: string
}> {}

export class ZoneChangeError extends Data.TaggedError("ZoneChangeError")<{
  readonly reason: string
}> {}
