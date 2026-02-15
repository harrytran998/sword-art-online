import { useEffect, useState } from "react"
import { authClient, fetchJwtToken } from "@adapters/auth/auth-client.js"
import { useAuthStore } from "@application/stores/auth.store.js"
import { useGameStore } from "@application/stores/game.store.js"
import { LoginPage } from "./auth/LoginPage.js"
import { RegisterPage } from "./auth/RegisterPage.js"

type AuthView = "login" | "register"

export const App = () => {
  const { isAuthenticated, isLoading, setUser, setToken, setLoading } =
    useAuthStore()
  const connectionStatus = useGameStore((s) => s.connectionStatus)
  const [authView, setAuthView] = useState<AuthView>("login")

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await authClient.getSession()

      if (data?.user) {
        setUser({
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
        })

        const token = await fetchJwtToken()
        if (token) {
          setToken(token)
        }
      }

      setLoading(false)
    }

    checkSession()
  }, [setUser, setToken, setLoading])

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-sao-dark">
        <p className="text-lg text-gray-400">Loading...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    if (authView === "register") {
      return <RegisterPage onSwitchToLogin={() => setAuthView("login")} />
    }
    return <LoginPage onSwitchToRegister={() => setAuthView("register")} />
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-sao-dark">
      <div className="text-center">
        <h1 className="mb-4 font-game text-6xl font-bold text-sao-blue">
          Sword Art Online
        </h1>
        <p className="mb-8 text-lg text-gray-400">
          Sword Art Online — Browser MMORPG
        </p>
        <div className="rounded-lg border border-sao-blue/20 bg-sao-panel p-6">
          <p className="text-sm text-gray-300">
            Status:{" "}
            <span
              className={
                connectionStatus === "connected"
                  ? "text-sao-green"
                  : "text-sao-gold"
              }
            >
              {connectionStatus}
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
