import { Effect } from "effect"

export const healthRoutes = {
  "/health": () =>
    Effect.succeed(
      new Response(JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }), {
        headers: { "Content-Type": "application/json" },
      }),
    ),

  "/healthz": () =>
    Effect.succeed(new Response("ok", { status: 200 })),
}
