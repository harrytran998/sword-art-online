import { Context, Effect, Layer } from "effect"
import type { ServerWebSocket } from "bun"
import { createRemoteJWKSet, jwtVerify } from "jose"
import { HEARTBEAT_TIMEOUT_MS } from "@sao/shared"
import { AppConfig } from "../../shared/infrastructure/config/index.js"
import { WorldPort } from "../../modules/world/ports/inbound/world.port.js"
import { EventBus } from "../../shared/infrastructure/event-bus/index.js"
import { CacheService } from "../../shared/infrastructure/cache/index.js"
import { handleRequest } from "../http/routes.js"
import { validateInput } from "../security/input-validator.js"
import { checkMessageRateLimit } from "../security/rate-limiter-config.js"
import { ErrorCodes } from "../security/error-codes.js"
import { logSecurityEvent, SecurityEventType } from "../security/security-logger.js"
import { decodeClientMessage, routeMessage } from "./message-router.js"
import type { PlayerId, ZoneId } from "../../shared/kernel/types.js"

interface WebSocketData {
  readonly playerId: PlayerId
  readonly sessionToken: string
  readonly connectedAt: number
  readonly zoneId: ZoneId
  lastHeartbeat: number
}

export class WebSocketGateway extends Context.Tag("WebSocketGateway")<
  WebSocketGateway,
  {
    readonly server: ReturnType<typeof Bun.serve>
    readonly addRoute: (
      prefix: string,
      handler: (req: Request) => Effect.Effect<Response>,
    ) => void
    readonly broadcastToZone: (
      zoneId: string,
      message: unknown,
    ) => Effect.Effect<void>
    readonly sendToPlayer: (
      playerId: string,
      message: unknown,
    ) => Effect.Effect<void>
    readonly getConnectionCount: () => number
    readonly disconnectPlayer: (playerId: string) => Effect.Effect<void>
  }
>() {}

export const WebSocketGatewayLive = Layer.effect(
  WebSocketGateway,
  Effect.gen(function* () {
    const config = yield* AppConfig
    const ctx = yield* Effect.context<
      WorldPort | EventBus | CacheService
    >()

    const connections = new Map<string, ServerWebSocket<WebSocketData>>()
    const playerMessageQueue = new Map<string, Promise<void>>()

    const customRoutes = new Map<
      string,
      (req: Request) => Effect.Effect<Response>
    >()

    // JWKS endpoint for JWT verification
    const jwksUrl = new URL(
      `/api/auth/jwks`,
      `http://localhost:${config.port}`,
    )
    let jwks: ReturnType<typeof createRemoteJWKSet> | null = null

    const getJwks = () => {
      if (!jwks) {
        jwks = createRemoteJWKSet(jwksUrl)
      }
      return jwks
    }

    const verifyToken = async (token: string) => {
      try {
        const { payload } = await jwtVerify(token, getJwks(), {
          issuer: config.jwtIssuer,
          audience: config.jwtAudience,
        })
        return payload
      } catch {
        return null
      }
    }

    const DEFAULT_ZONE = "floor_1_town" as ZoneId

    const sendError = (
      ws: ServerWebSocket<WebSocketData>,
      code: string,
      message: string,
    ) => {
      ws.send(JSON.stringify({ _tag: "error", code, message }))
    }

    const routeRequest = (
      req: Request,
      server: ReturnType<typeof Bun.serve>,
    ): Response | Promise<Response> => {
      const url = new URL(req.url)

      // WebSocket upgrade
      if (
        req.headers.get("upgrade")?.toLowerCase() === "websocket"
      ) {
        const token = url.searchParams.get("token")
        if (!token) {
          return new Response("Missing token", { status: 401 })
        }

        // Check origin
        const origin = req.headers.get("origin")
        if (
          origin &&
          config.nodeEnv === "production" &&
          !config.allowedOrigins.includes(origin)
        ) {
          return new Response("Invalid origin", { status: 403 })
        }

        return verifyToken(token).then((payload) => {
          if (!payload?.sub) {
            return new Response("Invalid token", { status: 401 })
          }

          const playerId = payload.sub as PlayerId
          const data: WebSocketData = {
            playerId,
            sessionToken: token,
            connectedAt: Date.now(),
            zoneId: DEFAULT_ZONE,
            lastHeartbeat: Date.now(),
          }

          const upgraded = server.upgrade(req, { data })
          if (!upgraded) {
            return new Response("WebSocket upgrade failed", {
              status: 500,
            })
          }

          return new Response(null, { status: 101 })
        })
      }

      // Custom routes
      for (const [prefix, handler] of customRoutes) {
        if (url.pathname.startsWith(prefix)) {
          return Effect.runPromise(handler(req))
        }
      }

      return Effect.runPromise(handleRequest(req))
    }

    const server = Bun.serve<WebSocketData>({
      port: config.port,
      hostname: config.host,
      fetch: (req, server) => routeRequest(req, server),
      websocket: {
        open(ws) {
          // Close existing connection to prevent orphaned sockets
          const existing = connections.get(ws.data.playerId)
          if (existing) {
            existing.close(1000, "Superseded by new connection")
          }

          connections.set(ws.data.playerId, ws)
          ws.subscribe(`zone:${ws.data.zoneId}`)
          ws.subscribe(`player:${ws.data.playerId}`)

          // Set player zone in world module
          Effect.runPromise(
            Effect.gen(function* () {
              const world = yield* WorldPort
              yield* world.setPlayerZone(ws.data.playerId, ws.data.zoneId)
            }).pipe(Effect.provide(ctx)),
          )

          // Send connection_ready
          ws.send(
            JSON.stringify({
              _tag: "connection_ready",
              playerId: ws.data.playerId,
              name: "",
              level: 1,
              floor: 1,
            }),
          )

          // Broadcast player_joined to zone
          server.publish(
            `zone:${ws.data.zoneId}`,
            JSON.stringify({
              _tag: "player_joined",
              playerId: ws.data.playerId,
              name: "",
              level: 1,
            }),
          )
        },

        message(ws, raw) {
          ws.data.lastHeartbeat = Date.now()

          const playerId = ws.data.playerId
          const processMessage = () =>
            Effect.runPromise(
              Effect.gen(function* () {
                // 1. Validate input structure
                const validated = yield* validateInput(raw)
                if ("code" in validated && "message" in validated) {
                  // This won't happen because validateInput returns Effect
                  return
                }

                // 2. Check rate limit
                const allowed = yield* checkMessageRateLimit(
                  playerId,
                  validated._tag,
                )
                if (!allowed) {
                  yield* logSecurityEvent({
                    type: SecurityEventType.RATE_LIMITED,
                    playerId,
                    severity: "warning",
                    data: { tag: validated._tag },
                  })
                  sendError(ws, ErrorCodes.RATE_LIMITED, "Rate limit exceeded")
                  return
                }

                // 3. Decode through schema
                const decoded = yield* decodeClientMessage(validated).pipe(
                  Effect.catchAll((err) => {
                    sendError(
                      ws,
                      ErrorCodes.INVALID_MESSAGE,
                      `Invalid message format: ${err}`,
                    )
                    return Effect.fail(err)
                  }),
                )

                // 4. Route message
                const result = yield* routeMessage(
                  decoded,
                  playerId,
                ).pipe(
                  Effect.catchAll((err) => {
                    const error =
                      err &&
                      typeof err === "object" &&
                      "_tag" in err
                        ? (err as { _tag: string })
                        : null
                    if (error?._tag === "InvalidPositionError") {
                      sendError(
                        ws,
                        ErrorCodes.INVALID_POSITION,
                        "Invalid position",
                      )
                    } else {
                      sendError(
                        ws,
                        ErrorCodes.INTERNAL_ERROR,
                        "Internal error",
                      )
                    }
                    return Effect.void
                  }),
                )

                // 5. If heartbeat_ack, send response directly
                if (
                  result &&
                  typeof result === "object" &&
                  "_tag" in result &&
                  (result as { _tag: string })._tag === "heartbeat_ack"
                ) {
                  ws.send(JSON.stringify(result))
                }
              }).pipe(
                Effect.provide(ctx),
                Effect.catchAll((err) => {
                  sendError(
                    ws,
                    ErrorCodes.INTERNAL_ERROR,
                    "Message processing failed",
                  )
                  return Effect.logError(`WS message error: ${err}`)
                }),
              ),
            )

          // Serialize message processing per player to prevent TOCTOU races
          const prev = playerMessageQueue.get(playerId) ?? Promise.resolve()
          const next = prev.then(processMessage, processMessage)
          playerMessageQueue.set(playerId, next)
        },

        close(ws) {
          connections.delete(ws.data.playerId)
          playerMessageQueue.delete(ws.data.playerId)
          ws.unsubscribe(`zone:${ws.data.zoneId}`)
          ws.unsubscribe(`player:${ws.data.playerId}`)

          // Broadcast player_left
          server.publish(
            `zone:${ws.data.zoneId}`,
            JSON.stringify({
              _tag: "player_left",
              playerId: ws.data.playerId,
            }),
          )

          // Remove player from world + publish event
          Effect.runPromise(
            Effect.gen(function* () {
              const world = yield* WorldPort
              yield* world.removePlayer(ws.data.playerId)

              const eventBus = yield* EventBus
              yield* eventBus.publish({
                _tag: "PlayerLeftZone",
                timestamp: new Date(),
                aggregateId: ws.data.playerId,
                playerId: ws.data.playerId,
                zoneId: ws.data.zoneId,
              } as unknown as import("../../shared/kernel/events.js").DomainEvent)
            }).pipe(Effect.provide(ctx)),
          )
        },
      },
    })

    // Heartbeat scanner — close stale connections
    setInterval(() => {
      const now = Date.now()
      for (const [playerId, ws] of connections) {
        if (now - ws.data.lastHeartbeat > HEARTBEAT_TIMEOUT_MS) {
          ws.close(1000, "Heartbeat timeout")
          connections.delete(playerId)
        }
      }
    }, 10000)

    yield* Effect.logInfo(
      `WebSocket server listening on http://${config.host}:${config.port}`,
    )

    return {
      server,

      addRoute: (prefix, handler) => {
        customRoutes.set(prefix, handler)
      },

      broadcastToZone: (zoneId, message) =>
        Effect.sync(() => {
          server.publish(`zone:${zoneId}`, JSON.stringify(message))
        }),

      sendToPlayer: (playerId, message) =>
        Effect.sync(() => {
          const ws = connections.get(playerId)
          ws?.send(JSON.stringify(message))
        }),

      getConnectionCount: () => connections.size,

      disconnectPlayer: (playerId) =>
        Effect.sync(() => {
          const ws = connections.get(playerId)
          if (ws) {
            ws.close(1000, "Disconnected by server")
            connections.delete(playerId)
          }
        }),
    }
  }),
)
