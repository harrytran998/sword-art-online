import { createAuthClient } from "better-auth/client"
import { jwtClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL ?? "",
  plugins: [jwtClient()],
})

export const fetchJwtToken = async (): Promise<string | null> => {
  try {
    const response = await fetch("/api/auth/token", {
      credentials: "include",
    })
    if (!response.ok) return null
    const data = await response.json()
    return data.token ?? null
  } catch {
    return null
  }
}
