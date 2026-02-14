import { Context, Effect, Layer } from "effect"
import { betterAuth } from "better-auth"
import pg from "pg"
import { AppConfig } from "../../../../shared/infrastructure/config/index.js"

export class BetterAuthService extends Context.Tag("BetterAuthService")<
  BetterAuthService,
  {
    readonly auth: ReturnType<typeof betterAuth>
  }
>() {}

export const BetterAuthServiceLive = Layer.effect(
  BetterAuthService,
  Effect.gen(function* () {
    const config = yield* AppConfig

    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      min: 2,
      max: 5,
    })

    const auth = betterAuth({
      database: pool,
      secret: process.env.BETTER_AUTH_SECRET,
      baseURL: `http://${config.host}:${config.port}`,
      emailAndPassword: {
        enabled: true,
        minPasswordLength: 8,
        maxPasswordLength: 128,
      },
      session: {
        expiresIn: 60 * 60 * 24 * 7,
        updateAge: 60 * 60 * 24,
      },
      advanced: {
        database: {
          generateId: false,
        },
      },
    })

    return { auth }
  }),
)
