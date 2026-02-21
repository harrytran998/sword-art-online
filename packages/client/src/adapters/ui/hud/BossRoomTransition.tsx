import React, { useEffect, useState } from "react"
import { useGameStore } from "@application/stores/game.store"

export const BossRoomTransition: React.FC = () => {
  const activeBoss = useGameStore((state) => state.activeBoss)
  const [showTransition, setShowTransition] = useState(false)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    if (!activeBoss || showTransition) return

    setShowTransition(true)
    setFadeOut(false)

    const fadeTimer = setTimeout(() => {
      setFadeOut(true)
    }, 2500)

    const hideTimer = setTimeout(() => {
      setShowTransition(false)
    }, 3500)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(hideTimer)
    }
  }, [activeBoss?.name])

  if (!showTransition || !activeBoss) return null

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center bg-black/90 transition-opacity duration-1000 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-4">
        {/* Boss name reveal */}
        <div className="overflow-hidden">
          <h1
            className="text-4xl font-bold text-red-100 uppercase tracking-[0.3em] animate-[slideUp_1s_ease-out]"
            style={{
              textShadow: "0 0 20px rgba(239,68,68,0.6), 0 0 40px rgba(239,68,68,0.3)",
            }}
          >
            {activeBoss.name}
          </h1>
        </div>

        {/* Level indicator */}
        <span className="text-lg text-yellow-300 font-semibold tracking-widest">
          — Level {activeBoss.level} Floor Boss —
        </span>

        {/* Decorative line */}
        <div className="w-64 h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent" />
      </div>
    </div>
  )
}
