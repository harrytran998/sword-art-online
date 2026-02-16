import { Layer } from "effect"
import { AuthHandlerLive } from "./adapters/inbound/auth.handler"
import { BetterAuthServiceLive } from "./adapters/outbound/better-auth"
import { PgAccountRepositoryLive } from "./adapters/outbound/pg-account.repository"

export const IdentityModule = Layer.mergeAll(
  PgAccountRepositoryLive,
  AuthHandlerLive.pipe(Layer.provide(BetterAuthServiceLive)),
)
