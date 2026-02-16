import { Context, Effect, Layer } from "effect"
import type { ServerWebSocket } from "bun"
import { createRemoteJWKSet, jwtVerify } from "jose"
import { HEARTBEAT_TIMEOUT_MS } from "@sao/shared"
import { AppConfig } from "../../shared/infrastructure/config/index"
import { WorldPort } from "../../modules/world/ports/inbound/world.port"
import { PlayerPort } from "../../modules/player/ports/inbound/player.port"
import { EventBus } from "../../shared/infrastructure/event-bus/index"
import { CacheService } from "../../shared/infrastructure/cache/index"
import { handleRequest } from "../http/routes"
import { validateInput } from "../security/input-validator"
import { checkMessageRateLimit } from "../security/rate-limiter-config"
import { ErrorCodes } from "../security/error-codes"
import { logSecurityEvent, SecurityEventType } from "../../shared/infrastructure/security/security-logger"
import { decodeClientMessage, routeMessage } from "./message-router"
import { PlayerLeftZone } from "../../modules/world/events/published"
import type { PlayerId, ZoneId, AccountId } from "../../shared/kernel/types"

interface WebSocketData {
  playerId: PlayerId
  readonly accountId: AccountId
  readonly sessionToken: string
  readonly connectedAt: number
  zoneId: ZoneId
  playerName: string
  playerLevel: number
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
      WorldPort | PlayerPort | EventBus | CacheService
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
      jwks ??= createRemoteJWKSet(jwksUrl)
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

          const accountId = payload.sub as AccountId
          const data: WebSocketData = {
            playerId: accountId as unknown as PlayerId,
            accountId,
            sessionToken: token,
            connectedAt: Date.now(),
            zoneId: DEFAULT_ZONE,
            playerName: typeof payload.name === "string" ? payload.name : "",
            playerLevel: typeof payload.level === "number" ? payload.level : 1,
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
          void Effect.runPromise(
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
              name: ws.data.playerName,
              level: ws.data.playerLevel,
              floor: 1,
            }),
          )

          // Check if account has an existing character
          void Effect.runPromise(
            Effect.gen(function* () {
              const player = yield* PlayerPort
              const character = yield* player.getPlayerByAccountId(ws.data.accountId)
              if (character) {
                // Update websocket data with real character info
                ws.data.playerId = character.id
                ws.data.playerName = character.name
                ws.data.playerLevel = character.level

                ws.send(
                  JSON.stringify({
                    _tag: "character_data",
                    characterId: character.id,
                    name: character.name,
                    level: character.level,
                    experience: character.experience,
                    currentHp: character.currentHp,
                    maxHp: character.maxHp,
                    currentFloor: character.currentFloor,
                    col: character.col,
                    stats: character.stats,
                  }),
                )

                // Broadcast player_joined to zone
                server.publish(
                  `zone:${ws.data.zoneId}`,
                  JSON.stringify({
                    _tag: "player_joined",
                    playerId: character.id,
                    name: character.name,
                    level: character.level,
                  }),
                )
              } else {
                ws.send(JSON.stringify({ _tag: "no_character" }))
              }
            }).pipe(
              Effect.provide(ctx),
              Effect.catchAll((err) =>
                Effect.logError(`Failed to load character: ${String(err)}`),
              ),
            ),
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
                      `Invalid message format: ${String(err)}`,
                    )
                    return Effect.fail(err)
                  }),
                )

                // 4. Route message
                const result = yield* routeMessage(
                  decoded,
                  playerId,
                  ws.data.accountId,
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
                    } else if (error?._tag === "CharacterNameTakenError") {
                      ws.send(JSON.stringify({
                        _tag: "character_create_error",
                        code: "NAME_TAKEN",
                        message: "That character name is already taken",
                      }))
                    } else if (error?._tag === "InvalidCharacterNameError") {
                      ws.send(JSON.stringify({
                        _tag: "character_create_error",
                        code: "INVALID_NAME",
                        message: "Invalid character name",
                      }))
                    } else if (error?._tag === "InvalidClassIdError") {
                      ws.send(JSON.stringify({
                        _tag: "character_create_error",
                        code: "INVALID_CLASS",
                        message: "Invalid class selection",
                      }))
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

                // 5. Send response to client if applicable
                if (
                  result &&
                  typeof result === "object" &&
                  "_tag" in result
                ) {
                  const tag = (result as { _tag: string })._tag
                  if (tag === "heartbeat_ack") {
                    ws.send(JSON.stringify(result))
                  } else if (tag === "character_data") {
                    const charResult = result as {
                      _tag: string
                      characterId: string
                      name: string
                      level: number
                    }
                    // Update websocket data with the new character
                    ws.data.playerId = charResult.characterId as PlayerId
                    ws.data.playerName = charResult.name
                    ws.data.playerLevel = charResult.level

                    ws.send(JSON.stringify(result))

                    // Broadcast player_joined to zone
                    server.publish(
                      `zone:${ws.data.zoneId}`,
                      JSON.stringify({
                        _tag: "player_joined",
                        playerId: charResult.characterId,
                        name: charResult.name,
                        level: charResult.level,
                      }),
                    )
                  } else if (tag === "zone_state") {
                    // Zone change: switch pub/sub topics
                    const zoneResult = result as { _tag: string; zoneId: string }
                    const oldZoneId = ws.data.zoneId
                    const newZoneId = zoneResult.zoneId as ZoneId

                    ws.unsubscribe(`zone:${oldZoneId}`)
                    ws.subscribe(`zone:${newZoneId}`)
                    ws.data.zoneId = newZoneId

                    // Broadcast player_left to old zone
                    server.publish(
                      `zone:${oldZoneId}`,
                      JSON.stringify({
                        _tag: "player_left",
                        playerId: ws.data.playerId,
                      }),
                    )

                    // Send zone_state to the player
                    ws.send(JSON.stringify(result))

                    // Broadcast player_joined to new zone
                    server.publish(
                      `zone:${newZoneId}`,
                      JSON.stringify({
                        _tag: "player_joined",
                        playerId: ws.data.playerId,
                        name: ws.data.playerName,
                        level: ws.data.playerLevel,
                      }),
                    )
                  }
                }
              }).pipe(
                Effect.provide(ctx),
                Effect.catchAll((err) => {
                  sendError(
                    ws,
                    ErrorCodes.INTERNAL_ERROR,
                    "Message processing failed",
                  )
                  return Effect.logError(`WS message error: ${String(err)}`)
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
          void Effect.runPromise(
            Effect.gen(function* () {
              const world = yield* WorldPort
              yield* world.removePlayer(ws.data.playerId)

              const eventBus = yield* EventBus
              yield* eventBus.publish(new PlayerLeftZone({
                timestamp: new Date(),
                aggregateId: ws.data.playerId,
                playerId: ws.data.playerId,
                zoneId: ws.data.zoneId,
              }))
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
