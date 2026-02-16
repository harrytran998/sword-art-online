import { Effect } from "effect"
import { AuthPort } from "../ports/inbound/auth.port"
import { EventBus } from "../../../shared/infrastructure/event-bus/index"
import { PlayerRegistered, PlayerLoggedIn } from "../events/published"

export const handleAuthRequest = (request: Request) =>
  Effect.gen(function* () {
    const authPort = yield* AuthPort
    const eventBus = yield* EventBus

    const url = new URL(request.url)
    const isSignUp = url.pathname.includes("sign-up")
    const isSignIn = url.pathname.includes("sign-in")

    const response = yield* authPort.handleAuthRequest(request)

    if (response.ok && (isSignUp || isSignIn)) {
      const session = yield* authPort.getSession(request).pipe(
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

    return response
  })
