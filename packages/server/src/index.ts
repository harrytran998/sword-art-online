import { Effect, Layer } from "effect"
import { BunRuntime } from "@effect/platform-bun"

import { DatabaseServiceLive } from "./shared/infrastructure/database/index.js"
import { CacheServiceLive } from "./shared/infrastructure/cache/index.js"
import { InMemoryEventBusLive } from "./shared/infrastructure/event-bus/index.js"
import { AppConfigLive } from "./shared/infrastructure/config/index.js"
import { WebSocketGateway, WebSocketGatewayLive } from "./gateway/websocket/server.js"
import { GameLoopService, GameLoopServiceLive } from "./gateway/game-loop/game-loop.js"
import { GameStateLive } from "./gateway/game-loop/game-state.js"
import { SuspicionTrackerLive } from "./gateway/security/suspicion-tracker.js"
import { IdentityModule } from "./modules/identity/index.js"
import { AuthPort } from "./modules/identity/ports/inbound/auth.port.js"
import { PlayerModule } from "./modules/player/index.js"
import { WorldModule } from "./modules/world/index.js"
import { registerGatewaySubscriptions } from "./gateway/subscriptions.js"

// Infrastructure Layer
const InfrastructureLayer = Layer.mergeAll(
  DatabaseServiceLive,
  CacheServiceLive,
  InMemoryEventBusLive,
  AppConfigLive,
)

// Security Layer (depends on CacheService)
const SecurityLayer = SuspicionTrackerLive.pipe(
  Layer.provide(InfrastructureLayer),
)

// Module Layer
const ModuleLayer = Layer.mergeAll(IdentityModule, PlayerModule, WorldModule).pipe(
  Layer.provide(SecurityLayer),
  Layer.provide(InfrastructureLayer),
)

// Gateway Layer
const GatewayLayer = Layer.mergeAll(
  WebSocketGatewayLive,
  GameLoopServiceLive,
).pipe(
  Layer.provide(GameStateLive),
  Layer.provide(ModuleLayer),
  Layer.provide(SecurityLayer),
  Layer.provide(InfrastructureLayer),
)

// Application Layer — compose everything, also expose EventBus for main
const AppLayer = Layer.mergeAll(ModuleLayer, GatewayLayer, InfrastructureLayer)

// Main program
const main = Effect.gen(function* () {
  const gateway = yield* WebSocketGateway
  const authPort = yield* AuthPort
  const gameLoop = yield* GameLoopService

  // Register auth routes
  gateway.addRoute("/api/auth", (req) => authPort.handleAuthRequest(req))

  // Register gateway event subscriptions
  yield* registerGatewaySubscriptions({
    broadcastToZone: (zoneId, message) =>
      gateway.broadcastToZone(zoneId, message),
  })

  // Start game loop
  yield* gameLoop.start()

  yield* Effect.logInfo(
    `Sword Art Online — Server ready on http://${gateway.server.hostname}:${gateway.server.port}`,
  )
})

// Launch
main.pipe(Effect.provide(AppLayer), BunRuntime.runMain)
