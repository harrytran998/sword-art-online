import { describe, expect, it, afterAll } from "bun:test"
import { Effect, Layer } from "effect"
import { Kysely } from "kysely"
import { WebSocketGateway, WebSocketGatewayLive } from "../websocket/server"
import { SuspicionTrackerLive } from "../../shared/infrastructure/security/suspicion-tracker"
import { WorldModule } from "../../modules/world/index"
import { PlayerPort } from "../../modules/player/ports/inbound/player.port"
import { InMemoryEventBusLive } from "../../shared/infrastructure/event-bus/index"
import { AppConfig } from "../../shared/infrastructure/config/index"
import { CacheService } from "../../shared/infrastructure/cache/index"
import { DatabaseService } from "../../shared/infrastructure/database/index"
import type { Database } from "../../shared/infrastructure/database/types"

/**
 * Integration test for WebSocket server.
 *
 * Manual curl testing commands:
 *
 * # Health check
 * curl http://localhost:8080/health
 *
 * # Auth endpoints (register + login + get JWT)
 * curl -X POST http://localhost:8080/api/auth/sign-up/email \
 *   -H "Content-Type: application/json" \
 *   -d '{"email":"test@test.com","password":"testpass123","name":"TestPlayer"}'
 *
 * # JWKS endpoint
 * curl http://localhost:8080/api/auth/jwks
 *
 * # WebSocket test (via wscat or websocat)
 * # wscat -c "ws://localhost:8080/ws?token=<jwt>"
 */

const TEST_PORT = 9876

// In-memory cache for tests
const TestCacheLayer = Layer.succeed(CacheService, {
  get: () => Effect.succeed(null),
  set: () => Effect.void,
  del: () => Effect.void,
  increment: () => Effect.succeed(1),
  exists: () => Effect.succeed(false),
  acquireLock: () => Effect.succeed(true),
  releaseLock: () => Effect.void,
  expire: () => Effect.void,
  getOrSet: (_key, factory, _ttl) => factory(),
  sadd: () => Effect.succeed(1),
  srem: () => Effect.succeed(1),
  smembers: () => Effect.succeed([]),
  scard: () => Effect.succeed(0),
  hset: () => Effect.void,
  hgetall: () => Effect.succeed({}),
  hmset: () => Effect.void,
  hdel: () => Effect.void,
})

const TestConfigLayer = Layer.succeed(AppConfig, {
  port: TEST_PORT,
  host: "localhost",
  nodeEnv: "test",
  gameTickRate: 60,
  maxPlayersPerZone: 200,
  wsMaxPayloadSize: 65536,
  wsHeartbeatInterval: 30000,
  allowedOrigins: ["http://localhost:5173"],
  jwtIssuer: "sword-art-online",
  jwtAudience: "sword-art-game",
})

// Stub DatabaseService — PgZoneRepository is included in WorldModule but
// zone queries are never reached in these HTTP-level tests.
const TestDatabaseLayer = Layer.succeed(DatabaseService, {
  kysely: {} as Kysely<Database>,
})

// Stub PlayerPort for gateway tests
const TestPlayerPortLayer = Layer.succeed(PlayerPort, {
  createCharacter: () => Effect.succeed(null as never),
  getPlayer: () => Effect.succeed(null as never),
  getPlayerByAccountId: () => Effect.succeed(null),
  allocateStats: () => Effect.void,
  addCurrency: () => Effect.void,
  deductCurrency: () => Effect.void,
  grantExperience: () => Effect.succeed(null as never),
  applyDeathPenalty: () => Effect.void,
})

const InfraLayer = Layer.mergeAll(
  TestCacheLayer,
  InMemoryEventBusLive,
  TestConfigLayer,
  TestDatabaseLayer,
)

const SecurityLayer = SuspicionTrackerLive.pipe(Layer.provide(InfraLayer))

const ModuleLayer = Layer.mergeAll(
  WorldModule,
  TestPlayerPortLayer,
).pipe(
  Layer.provide(SecurityLayer),
  Layer.provide(InfraLayer),
)

const GatewayLayer = WebSocketGatewayLive.pipe(
  Layer.provide(ModuleLayer),
  Layer.provide(SecurityLayer),
  Layer.provide(InfraLayer),
)

let gateway: typeof WebSocketGateway.Service | null = null

const setupServer = async () => {
  if (gateway) return gateway

  gateway = await Effect.runPromise(
    Effect.gen(function* () {
      return yield* WebSocketGateway
    }).pipe(Effect.provide(GatewayLayer)),
  )

  return gateway
}

afterAll(async () => {
  if (gateway) {
    await gateway.server.stop()
  }
})

describe("WebSocket Integration", () => {
  it("should respond to health check", async () => {
    await setupServer()

    const res = await fetch(`http://localhost:${TEST_PORT}/health`)
    const body = (await res.json()) as { status: string }

    expect(res.status).toBe(200)
    expect(body.status).toBe("ok")
  })

  it("should reject WebSocket connection without token", async () => {
    await setupServer()

    const res = await fetch(`http://localhost:${TEST_PORT}/ws`, {
      headers: { Upgrade: "websocket" },
    })

    expect(res.status).toBe(401)
  })

  it("should reject WebSocket connection with invalid token", async () => {
    await setupServer()

    const res = await fetch(
      `http://localhost:${TEST_PORT}/ws?token=invalid-jwt-token`,
      {
        headers: { Upgrade: "websocket" },
      },
    )

    expect(res.status).toBe(401)
  })

  it("should return 404 for unknown routes", async () => {
    await setupServer()

    const res = await fetch(`http://localhost:${TEST_PORT}/unknown`)
    const body = (await res.json()) as { error: string }

    expect(res.status).toBe(404)
    expect(body.error).toBe("Not Found")
  })

  it("should track connection count", async () => {
    const gw = await setupServer()
    expect(gw.getConnectionCount()).toBe(0)
  })
})
