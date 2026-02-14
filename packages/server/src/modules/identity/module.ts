import { Layer } from "effect"
import { AuthHandlerLive } from "./adapters/inbound/auth.handler.js"
import { BetterAuthServiceLive } from "./adapters/outbound/better-auth.js"
import { PgAccountRepositoryLive } from "./adapters/outbound/pg-account.repository.js"

export const IdentityModule = Layer.mergeAll(
  PgAccountRepositoryLive,
  AuthHandlerLive.pipe(Layer.provide(BetterAuthServiceLive)),
)
