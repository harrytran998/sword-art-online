import { Context, Effect, Layer } from "effect"
import { betterAuth } from "better-auth"
import { jwt } from "better-auth/plugins/jwt"
import { bearer } from "better-auth/plugins/bearer"
import pg from "pg"
import { AppConfig } from "../../../../shared/infrastructure/config/index"

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
      user: {
        fields: {
          emailVerified: "email_verified",
          createdAt: "created_at",
          updatedAt: "updated_at",
        },
      },
      session: {
        expiresIn: 60 * 60 * 24 * 7,
        updateAge: 60 * 60 * 24,
        fields: {
          expiresAt: "expires_at",
          createdAt: "created_at",
          updatedAt: "updated_at",
          ipAddress: "ip_address",
          userAgent: "user_agent",
          userId: "user_id",
        },
      },
      account: {
        fields: {
          accountId: "account_id",
          providerId: "provider_id",
          userId: "user_id",
          accessToken: "access_token",
          refreshToken: "refresh_token",
          idToken: "id_token",
          accessTokenExpiresAt: "access_token_expires_at",
          refreshTokenExpiresAt: "refresh_token_expires_at",
          createdAt: "created_at",
          updatedAt: "updated_at",
        },
      },
      verification: {
        fields: {
          expiresAt: "expires_at",
          createdAt: "created_at",
          updatedAt: "updated_at",
        },
      },
      plugins: [
        jwt({
          jwt: {
            issuer: "sword-art-online",
            audience: "sword-art-game",
            expirationTime: "1h",
          },
        }),
        bearer(),
      ],
      advanced: {
        database: {
          generateId: "uuid",
        },
      },
    })

    return { auth }
  }),
)
