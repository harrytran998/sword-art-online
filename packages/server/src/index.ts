import { Effect, Layer } from "effect"
import { BunRuntime } from "@effect/platform-bun"

import { DatabaseServiceLive } from "./shared/infrastructure/database/index"
import { CacheServiceLive } from "./shared/infrastructure/cache/index"
import { InMemoryEventBusLive } from "./shared/infrastructure/event-bus/index"
import { AppConfigLive } from "./shared/infrastructure/config/index"
import { WebSocketGateway, WebSocketGatewayLive } from "./gateway/websocket/server"
import { GameLoopService, GameLoopServiceLive } from "./gateway/game-loop/game-loop"
import { GameStateLive } from "./gateway/game-loop/game-state"
import { SuspicionTrackerLive } from "./shared/infrastructure/security/suspicion-tracker"
import { IdentityModule } from "./modules/identity/index"
import { AuthPort } from "./modules/identity/ports/inbound/auth.port"
import { PlayerModule } from "./modules/player/index"
import { WorldModule } from "./modules/world/index"
import { SocialModule } from "./modules/social/index"
import { registerGatewaySubscriptions } from "./gateway/subscriptions"

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
const ModuleLayer = Layer.mergeAll(IdentityModule, PlayerModule, WorldModule, SocialModule).pipe(
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
