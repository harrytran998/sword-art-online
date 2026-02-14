import { Effect, Layer } from "effect"
import { BunRuntime } from "@effect/platform-bun"

import { DatabaseServiceLive } from "./shared/infrastructure/database/index.js"
import { CacheServiceLive } from "./shared/infrastructure/cache/index.js"
import { InMemoryEventBusLive } from "./shared/infrastructure/event-bus/index.js"
import { AppConfigLive } from "./shared/infrastructure/config/index.js"
import { WebSocketGateway, WebSocketGatewayLive } from "./gateway/websocket/server.js"
import { GameLoopServiceLive } from "./gateway/game-loop/game-loop.js"
import { IdentityModule } from "./modules/identity/index.js"
import { AuthPort } from "./modules/identity/ports/inbound/auth.port.js"
import { PlayerModule } from "./modules/player/index.js"

// Infrastructure Layer
const InfrastructureLayer = Layer.mergeAll(
  DatabaseServiceLive,
  CacheServiceLive,
  InMemoryEventBusLive,
  AppConfigLive,
)

// Module Layer
const ModuleLayer = Layer.mergeAll(IdentityModule, PlayerModule).pipe(
  Layer.provide(InfrastructureLayer),
)

// Gateway Layer
const GatewayLayer = Layer.mergeAll(
  WebSocketGatewayLive,
  GameLoopServiceLive,
).pipe(Layer.provide(InfrastructureLayer))

// Application Layer — compose everything
const AppLayer = Layer.mergeAll(ModuleLayer, GatewayLayer)

// Main program
const main = Effect.gen(function* () {
  const gateway = yield* WebSocketGateway
  const authPort = yield* AuthPort

  gateway.addRoute("/api/auth", (req) => authPort.handleAuthRequest(req))

  yield* Effect.logInfo(
    `Sword Art Online — Server ready on http://${gateway.server.hostname}:${gateway.server.port}`,
  )
})

// Launch
main.pipe(Effect.provide(AppLayer), BunRuntime.runMain)
