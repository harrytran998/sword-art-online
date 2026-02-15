import { Context, Effect, Layer } from "effect"

export interface AppConfigShape {
  readonly port: number
  readonly host: string
  readonly nodeEnv: string
  readonly gameTickRate: number
  readonly maxPlayersPerZone: number
  readonly wsMaxPayloadSize: number
  readonly wsHeartbeatInterval: number
  readonly allowedOrigins: readonly string[]
  readonly jwtIssuer: string
  readonly jwtAudience: string
}

export class AppConfig extends Context.Tag("AppConfig")<AppConfig, AppConfigShape>() {}

export const AppConfigLive = Layer.effect(
  AppConfig,
  Effect.sync(() => ({
    port: Number(process.env.PORT ?? 8080),
    host: process.env.HOST ?? "0.0.0.0",
    nodeEnv: process.env.NODE_ENV ?? "development",
    gameTickRate: Number(process.env.GAME_TICK_RATE ?? 60),
    maxPlayersPerZone: Number(process.env.MAX_PLAYERS_PER_ZONE ?? 200),
    wsMaxPayloadSize: Number(process.env.WS_MAX_PAYLOAD_SIZE ?? 65536),
    wsHeartbeatInterval: Number(process.env.WS_HEARTBEAT_INTERVAL ?? 30000),
    allowedOrigins: (process.env.ALLOWED_ORIGINS ?? "http://localhost:5173,http://localhost:3000").split(","),
    jwtIssuer: process.env.JWT_ISSUER ?? "sword-art-online",
    jwtAudience: process.env.JWT_AUDIENCE ?? "sword-art-game",
  })),
)
