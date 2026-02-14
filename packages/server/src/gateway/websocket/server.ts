import { Context, Effect, Layer } from "effect"
import { AppConfig } from "../../shared/infrastructure/config/index.js"
import { handleRequest } from "../http/routes.js"

export class WebSocketGateway extends Context.Tag("WebSocketGateway")<
  WebSocketGateway,
  {
    readonly server: ReturnType<typeof Bun.serve>
    readonly addRoute: (
      prefix: string,
      handler: (req: Request) => Effect.Effect<Response>,
    ) => void
  }
>() {}

export const WebSocketGatewayLive = Layer.effect(
  WebSocketGateway,
  Effect.gen(function* () {
    const config = yield* AppConfig

    const customRoutes = new Map<
      string,
      (req: Request) => Effect.Effect<Response>
    >()

    const routeRequest = (req: Request): Response | Promise<Response> => {
      const url = new URL(req.url)

      for (const [prefix, handler] of customRoutes) {
        if (url.pathname.startsWith(prefix)) {
          return Effect.runPromise(handler(req))
        }
      }

      return Effect.runPromise(handleRequest(req))
    }

    const server = Bun.serve({
      port: config.port,
      hostname: config.host,
      fetch: routeRequest,
    })

    yield* Effect.logInfo(
      `Server listening on http://${config.host}:${config.port}`,
    )

    return {
      server,
      addRoute: (prefix, handler) => {
        customRoutes.set(prefix, handler)
      },
    }
  }),
)
