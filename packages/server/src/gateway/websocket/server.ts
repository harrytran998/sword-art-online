import { Context, Effect, Layer } from "effect"
import type { AppConfigShape } from "../../shared/infrastructure/config/index.js"

export class WebSocketGateway extends Context.Tag("WebSocketGateway")<
  WebSocketGateway,
  { readonly server: unknown }
>() {}

export const WebSocketGatewayLive = Layer.effect(
  WebSocketGateway,
  Effect.gen(function* () {
    // TODO: Implement Bun.serve with WebSocket upgrade
    // Will be completed in Sprint 3
    return { server: null }
  }),
)
