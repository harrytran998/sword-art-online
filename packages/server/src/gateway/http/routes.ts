import { Effect } from "effect"

export const handleRequest = (req: Request): Effect.Effect<Response> => {
  const url = new URL(req.url)
  const path = url.pathname

  if (path === "/health") {
    return Effect.succeed(
      Response.json({ status: "ok", timestamp: new Date().toISOString() }),
    )
  }

  if (path === "/healthz") {
    return Effect.succeed(new Response("ok", { status: 200 }))
  }

  return Effect.succeed(
    Response.json({ error: "Not Found" }, { status: 404 }),
  )
}
