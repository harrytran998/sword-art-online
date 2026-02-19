import { useEffect, useRef, useState } from "react"
import { authClient, fetchJwtToken } from "@adapters/auth/auth-client"
import { createWebSocketAdapter } from "@adapters/network/websocket.adapter"
import { handleServerMessage } from "@application/use-cases/handle-server-message"
import { useAuthStore } from "@application/stores/auth.store"
import { useGameStore } from "@application/stores/game.store"
import { LoginPage } from "./auth/LoginPage"
import { RegisterPage } from "./auth/RegisterPage"
import { CharacterCreate } from "./auth/CharacterCreate"
import { GameCanvas } from "./GameCanvas"

type AuthView = "login" | "register"

export const App = () => {
  const { isAuthenticated, isLoading, token, setUser, setToken, setLoading } =
    useAuthStore()
  const { gamePhase, setConnectionStatus } = useGameStore()
  const [authView, setAuthView] = useState<AuthView>("login")
  const networkRef = useRef<ReturnType<typeof createWebSocketAdapter> | null>(null)

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await authClient.getSession()

      if (data?.user) {
        setUser({
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
        })

        const jwtToken = await fetchJwtToken()
        if (jwtToken) {
          setToken(jwtToken)
        }
      }

      setLoading(false)
    }

    void checkSession()
  }, [setUser, setToken, setLoading])

  // After auth, establish WebSocket connection — let the server drive the phase
  useEffect(() => {
    if (!isAuthenticated || !token) return

    const network = createWebSocketAdapter()
    networkRef.current = network

    const unsubMessage = network.onMessage(handleServerMessage)
    const unsubDisconnect = network.onDisconnect(() => {
      setConnectionStatus("disconnected")
    })

    const wsUrl = `ws://${window.location.hostname}:${window.location.port || "8080"}`
    setConnectionStatus("connecting")
    network.connect(wsUrl, token)

    return () => {
      unsubMessage()
      unsubDisconnect()
      network.disconnect()
      networkRef.current = null
    }
  }, [isAuthenticated, token, setConnectionStatus])

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

  // Game phases
  if (gamePhase === "character_create") {
    return (
      <CharacterCreate
        onCreateCharacter={(name, classId) => {
          const network = networkRef.current
          if (!network?.isConnected()) return

          useGameStore.getState().setIsCreatingCharacter(true)
          network.send({ _tag: "create_character", name, classId })
        }}
      />
    )
  }

  if (gamePhase === "in_game") {
    return <GameCanvas networkRef={networkRef} />
  }

  // Loading / waiting for server response
  return (
    <div className="flex h-full w-full items-center justify-center bg-sao-dark">
      <div className="text-center">
        <h1 className="mb-4 font-game text-6xl font-bold text-sao-blue">
          Sword Art Online
        </h1>
        <p className="text-lg text-gray-400">
          Preparing your adventure...
        </p>
      </div>
    </div>
  )
}
