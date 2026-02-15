import { afterAll, beforeAll, describe, expect, it } from "bun:test"
import { betterAuth } from "better-auth"
import { jwt } from "better-auth/plugins/jwt"
import { bearer } from "better-auth/plugins/bearer"
import pg from "pg"

const CONNECTION_STRING = "postgresql://postgres:postgres@localhost:5432/sao"
const TEST_SECRET = "test-secret-for-integration-tests"
const TEST_EMAIL = `auth-test-${Date.now()}@integration.test`
const TEST_PASSWORD = "TestPassword123!"
const TEST_NAME = `TestUser${Date.now()}`

let pool: pg.Pool
let auth: ReturnType<typeof betterAuth>
let sessionToken: string
let jwtToken: string
let userId: string

beforeAll(() => {
  pool = new pg.Pool({ connectionString: CONNECTION_STRING, max: 2 })

  auth = betterAuth({
    database: pool,
    secret: TEST_SECRET,
    baseURL: "http://localhost:8080",
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
  })
})

afterAll(async () => {
  if (userId) {
    await pool.query("DELETE FROM sao.session WHERE user_id = $1", [userId])
    await pool.query("DELETE FROM sao.account WHERE user_id = $1", [userId])
    await pool.query("DELETE FROM sao.\"user\" WHERE id = $1", [userId])
  }
  await pool.end()
})

describe("Auth integration", () => {
  it("should register a new user", async () => {
    const result = await auth.api.signUpEmail({
      body: {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        name: TEST_NAME,
      },
    })

    expect(result.user).toBeDefined()
    expect(result.user.email).toBe(TEST_EMAIL)
    expect(result.user.name).toBe(TEST_NAME)
    userId = result.user.id
  })

  it("should login with email and password", async () => {
    const result = await auth.api.signInEmail({
      body: {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      },
    })

    expect(result.token).toBeDefined()
    expect(typeof result.token).toBe("string")
    sessionToken = result.token!
  })

  it("should get a JWT token using session", async () => {
    type JwtApi = { getToken: (opts: { headers: Headers }) => Promise<{ token: string }> }
    const jwtApi = auth.api as unknown as JwtApi
    const result = await jwtApi.getToken({
      headers: new Headers({
        authorization: `Bearer ${sessionToken}`,
      }),
    })

    expect(result.token).toBeDefined()
    expect(typeof result.token).toBe("string")
    jwtToken = result.token
  })

  it("should have valid JWT payload with correct iss, aud, sub", () => {
    const parts = jwtToken.split(".")
    expect(parts.length).toBe(3)

    const payload = JSON.parse(atob(parts[1]!)) as { iss: string; aud: string; sub: string; exp: number }
    expect(payload.iss).toBe("sword-art-online")
    expect(payload.aud).toBe("sword-art-game")
    expect(payload.sub).toBe(userId)
    expect(payload.exp).toBeDefined()
  })

  it("should revoke session and invalidate access", async () => {
    await auth.api.revokeSession({
      headers: new Headers({
        authorization: `Bearer ${sessionToken}`,
      }),
      body: {
        token: sessionToken,
      },
    })

    const sessionAfter = await auth.api.getSession({
      headers: new Headers({
        authorization: `Bearer ${sessionToken}`,
      }),
    })
    expect(sessionAfter).toBeNull()
  })
})
