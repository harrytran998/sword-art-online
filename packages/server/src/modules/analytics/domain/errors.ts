import { Data } from "effect"

export class MetricNotFoundError extends Data.TaggedError("MetricNotFoundError")<{
  readonly metricName: string
}> {}
