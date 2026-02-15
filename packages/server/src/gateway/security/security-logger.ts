import { Effect } from "effect"

export const SecurityEventType = {
  RATE_LIMITED: "RATE_LIMITED",
  SPEED_HACK: "SPEED_HACK",
  TELEPORT_HACK: "TELEPORT_HACK",
  INVALID_INPUT: "INVALID_INPUT",
  SUSPICION_THRESHOLD: "SUSPICION_THRESHOLD",
} as const

export type SecurityEventTypeValue = (typeof SecurityEventType)[keyof typeof SecurityEventType]

interface SecurityEvent {
  readonly type: SecurityEventTypeValue
  readonly playerId: string
  readonly severity: "info" | "warning" | "critical"
  readonly data?: Record<string, unknown>
}

export const logSecurityEvent = (event: SecurityEvent): Effect.Effect<void> =>
  Effect.logWarning("Security event").pipe(
    Effect.annotateLogs("security_type", event.type),
    Effect.annotateLogs("playerId", event.playerId),
    Effect.annotateLogs("severity", event.severity),
    Effect.annotateLogs("security_data", JSON.stringify(event.data ?? {})),
  )
