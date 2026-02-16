import { Effect, Layer } from "effect"
import { AuthPort } from "../../ports/inbound/auth.port"
import { BetterAuthService } from "../outbound/better-auth"
import { EventBus } from "../../../../shared/infrastructure/event-bus/index"
import { PlayerRegistered, PlayerLoggedIn } from "../../events/published"

export const AuthHandlerLive = Layer.effect(
  AuthPort,
  Effect.gen(function* () {
    const { auth } = yield* BetterAuthService
    const eventBus = yield* EventBus

    return {
      handleAuthRequest: (request: Request) =>
        Effect.gen(function* () {
          const response = yield* Effect.tryPromise(
            () => auth.handler(request),
          ).pipe(Effect.orDie)

          if (response.ok) {
            const url = new URL(request.url)
            const isSignUp = url.pathname.includes("sign-up")
            const isSignIn = url.pathname.includes("sign-in")

            if (isSignUp || isSignIn) {
              const session = yield* Effect.tryPromise(() =>
                auth.api.getSession({ headers: request.headers }),
              ).pipe(
                Effect.map((result) => {
                  if (!result) return null
                  return { userId: result.user.id, email: result.user.email }
                }),
                Effect.catchAll(() => Effect.succeed(null)),
              )

              if (session) {
                if (isSignUp) {
                  yield* eventBus.publish(new PlayerRegistered({
                    timestamp: new Date(),
                    aggregateId: session.userId,
                    accountId: session.userId,
                    email: session.email,
                  }))
                } else {
                  yield* eventBus.publish(new PlayerLoggedIn({
                    timestamp: new Date(),
                    aggregateId: session.userId,
                    playerId: session.userId,
                  }))
                }
              }
            }
          }

          return response
        }),

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
