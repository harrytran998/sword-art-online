import { useEffect, useState } from "react"
import { authClient, fetchJwtToken } from "@adapters/auth/auth-client"
import { useAuthStore } from "@application/stores/auth.store"
import { useGameStore } from "@application/stores/game.store"
import { LoginPage } from "./auth/LoginPage"
import { RegisterPage } from "./auth/RegisterPage"
import { CharacterCreate } from "./auth/CharacterCreate"
import { GameCanvas } from "./GameCanvas"

type AuthView = "login" | "register"

export const App = () => {
  const { isAuthenticated, isLoading, setUser, setToken, setLoading } =
    useAuthStore()
  const { gamePhase, setGamePhase, setCurrentCharacter } = useGameStore()
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

    void checkSession()
  }, [setUser, setToken, setLoading])

  // After auth, determine game phase
  useEffect(() => {
    if (!isAuthenticated) return

    // For now, go straight to character creation since we don't
    // have character loading from server yet
    setGamePhase("character_create")
  }, [isAuthenticated, setGamePhase])

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
          // Set a temporary character for now — real creation will call server API
          setCurrentCharacter({
            id: useAuthStore.getState().user?.id ?? "unknown",
            name,
            level: 1,
            experience: 0,
            currentHp: 100,
            maxHp: 100,
            currentFloor: 1,
            col: 0,
            isAlive: true,
            stats: {
              str: 5,
              agi: 5,
              vit: 5,
              dex: 5,
              int: 5,
              lck: 5,
              ...(classId > 0 ? {} : {}),
            },
          })
          setGamePhase("in_game")
        }}
      />
    )
  }

  if (gamePhase === "in_game") {
    return <GameCanvas />
  }

  // Loading / character_select fallback
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
