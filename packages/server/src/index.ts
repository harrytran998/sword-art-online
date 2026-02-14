import { Effect, Layer } from "effect"
import { BunRuntime } from "@effect/platform-bun"

import { DatabaseServiceLive } from "./shared/infrastructure/database/index.js"
import { CacheServiceLive } from "./shared/infrastructure/cache/index.js"
import { InMemoryEventBusLive } from "./shared/infrastructure/event-bus/index.js"
import { AppConfigLive } from "./shared/infrastructure/config/index.js"
import { WebSocketGatewayLive } from "./gateway/websocket/server.js"
import { GameLoopServiceLive } from "./gateway/game-loop/game-loop.js"

// Infrastructure Layer
const InfrastructureLayer = Layer.mergeAll(
  DatabaseServiceLive,
  CacheServiceLive,
  InMemoryEventBusLive,
  AppConfigLive,
)

// Gateway Layer
const GatewayLayer = Layer.mergeAll(
  WebSocketGatewayLive,
  GameLoopServiceLive,
).pipe(Layer.provide(InfrastructureLayer))

// Main program
const main = Effect.gen(function* () {
  console.log("⚔️  Sword Art Online — Server Starting...")
  console.log(`   Port: ${process.env.PORT ?? 8080}`)
  console.log(`   Environment: ${process.env.NODE_ENV ?? "development"}`)
  console.log("   Status: Ready")
})

// Launch
main.pipe(
  Effect.provide(GatewayLayer),
  BunRuntime.runMain,
)
