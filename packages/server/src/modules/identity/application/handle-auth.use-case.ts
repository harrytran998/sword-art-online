import { Effect } from "effect"
import { AuthPort } from "../ports/inbound/auth.port.js"
import { EventBus } from "../../../shared/infrastructure/event-bus/index.js"
import { createEvent } from "../../../shared/kernel/events.js"

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
          yield* eventBus.publish(
            createEvent("PlayerRegistered", session.userId),
          )
        } else {
          yield* eventBus.publish(
            createEvent("PlayerLoggedIn", session.userId),
          )
        }
      }
    }

    return response
  })
