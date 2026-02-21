import { useGameStore } from "@application/stores/game.store"
import React from "react"

export const BossHpBar: React.FC = () => {
  const activeBoss = useGameStore((state) => state.activeBoss)

  if (!activeBoss) return null

  const bars = activeBoss.hpBars
  const totalHp = bars.reduce((a, b) => a + b, 0)
  const currentHp = activeBoss.currentHp
  const phase = activeBoss.phase

  const phaseLabels = ["Phase I", "Phase II", "Phase III — ENRAGE"]
  const phaseColors = [
    "from-red-600 via-red-500 to-red-400",
    "from-orange-600 via-orange-500 to-orange-400",
    "from-purple-600 via-pink-500 to-red-500",
  ]

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none select-none z-[100]">
      {/* Boss Name & Level */}
      <div className="flex items-center gap-3 mb-1">
        <span className="text-lg font-bold text-red-100 uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          {activeBoss.name}
        </span>
        <span className="text-xs text-red-300 font-semibold">
          Lv. {activeBoss.level}
        </span>
      </div>

      {/* Phase indicator */}
      <span
        className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${
          phase === 3
            ? "text-red-400 animate-pulse"
            : "text-yellow-300"
        }`}
      >
        {phaseLabels[phase - 1]}
      </span>

      {/* Multi-bar HP display */}
      <div className="flex gap-1 w-[600px]">
        {bars.map((barMax, index) => {
          const barIndex = index
          const previousBarsHp = bars.slice(0, barIndex).reduce((a, b) => a + b, 0)
          const barCurrentHp = Math.max(0, Math.min(barMax, currentHp - previousBarsHp))
          const barPercent = (barCurrentHp / barMax) * 100

          return (
            <div
              key={barIndex}
              className="flex-1 relative h-6 bg-black/80 border border-gray-600 overflow-hidden"
            >
              <div
                className={`absolute top-0 left-0 h-full bg-gradient-to-r ${phaseColors[phase - 1]} transition-all duration-300`}
                style={{ width: `${barPercent}%` }}
              />
              {/* Bar separator glow */}
              {barIndex < bars.length - 1 && (
                <div className="absolute right-0 top-0 h-full w-[2px] bg-yellow-400/60" />
              )}
            </div>
          )
        })}
      </div>

      {/* HP Text */}
      <span className="text-xs font-mono text-white/90 mt-1 drop-shadow-md">
        {Math.max(0, currentHp).toLocaleString()} / {totalHp.toLocaleString()}
      </span>
    </div>
  )
}
