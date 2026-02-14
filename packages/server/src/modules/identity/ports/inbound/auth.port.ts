import { Context, Effect } from "effect"

export class AuthPort extends Context.Tag("AuthPort")<
  AuthPort,
  {
    readonly handleAuthRequest: (request: Request) => Effect.Effect<Response>
    readonly getSession: (
      request: Request,
    ) => Effect.Effect<{ userId: string; email: string } | null>
  }
>() {}
