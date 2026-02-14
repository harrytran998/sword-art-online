import { Effect, Layer } from "effect"
import { AuthPort } from "../../ports/inbound/auth.port.js"
import { BetterAuthService } from "../outbound/better-auth.js"

export const AuthHandlerLive = Layer.effect(
  AuthPort,
  Effect.gen(function* () {
    const { auth } = yield* BetterAuthService

    return {
      handleAuthRequest: (request: Request) =>
        Effect.tryPromise(() => auth.handler(request)).pipe(Effect.orDie),

      getSession: (request: Request) =>
        Effect.tryPromise(() =>
          auth.api.getSession({ headers: request.headers }),
        ).pipe(
          Effect.map((result) => {
            if (!result) return null
            return { userId: result.user.id, email: result.user.email }
          }),
          Effect.catchAll(() => Effect.succeed(null)),
        ),
    }
  }),
)
