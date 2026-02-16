import { Effect } from "effect"
import { decodePositionUpdate } from "../websocket/binary-protocol"
import { ErrorCodes } from "./error-codes"

const KNOWN_TAGS = new Set([
  "movement",
  "skill_activate",
  "skill_cancel",
  "chat",
  "trade_request",
  "trade_accept",
  "item_use",
  "item_equip",
  "heartbeat",
])

export interface ValidatedMessage {
  readonly _tag: string
  readonly [key: string]: unknown
}

export interface InputValidationError {
  readonly code: string
  readonly message: string
}

export const validateInput = (
  raw: string | Buffer | ArrayBuffer,
): Effect.Effect<ValidatedMessage, InputValidationError> => {
  if (typeof raw !== "string") {
    const buffer =
      raw instanceof ArrayBuffer
        ? raw
        : raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength)
    const view = new DataView(buffer as ArrayBuffer)

    if (view.byteLength > 0 && view.getUint8(0) === 0x01) {
      const decoded = decodePositionUpdate(buffer as ArrayBuffer)
      if (!decoded) {
        return Effect.fail({
          code: ErrorCodes.INVALID_MESSAGE,
          message: "Invalid binary position update",
        })
      }
      return Effect.succeed({
        _tag: "movement",
        x: decoded.x,
        y: decoded.y,
        z: decoded.z,
        rotation: decoded.rotation,
        timestamp: Date.now(),
      })
    }

    return Effect.fail({
      code: ErrorCodes.INVALID_MESSAGE,
      message: "Unknown binary message type",
    })
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return Effect.fail({
      code: ErrorCodes.INVALID_MESSAGE,
      message: "Invalid JSON",
    })
  }

  if (typeof parsed !== "object" || parsed === null) {
    return Effect.fail({
      code: ErrorCodes.INVALID_MESSAGE,
      message: "Message must be an object",
    })
  }

  const msg = parsed as Record<string, unknown>

  if (typeof msg._tag !== "string") {
    return Effect.fail({
      code: ErrorCodes.INVALID_MESSAGE,
      message: "Missing _tag field",
    })
  }

  if (!KNOWN_TAGS.has(msg._tag)) {
    return Effect.fail({
      code: ErrorCodes.INVALID_MESSAGE,
      message: `Unknown message type: ${msg._tag}`,
    })
  }

  return Effect.succeed(msg as ValidatedMessage)
}
