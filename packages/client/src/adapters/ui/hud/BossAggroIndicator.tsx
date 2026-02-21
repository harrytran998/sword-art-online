import { useGameStore } from "@application/stores/game.store"
import React from "react"

export const BossAggroIndicator: React.FC = () => {
  const activeBoss = useGameStore((state) => state.activeBoss)

  if (!activeBoss || !activeBoss.targetPlayerId) return null

  return (
    <div className="absolute top-[110px] left-1/2 -translate-x-1/2 pointer-events-none select-none z-[100]">
      <div className="flex items-center gap-2 bg-black/60 border border-red-500/50 rounded px-3 py-1 backdrop-blur-sm">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
        <span className="text-[10px] text-red-200 font-semibold uppercase tracking-wider">
          Targeting: {activeBoss.targetPlayerId}
        </span>
      </div>
    </div>
  )
}
