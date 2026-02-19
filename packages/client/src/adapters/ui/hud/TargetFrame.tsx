import { useGameStore } from "@application/stores/game.store"
import { usePlayerStore } from "@application/stores/player.store"
import React from "react"

export const TargetFrame: React.FC = () => {
  const selectedTargetId = usePlayerStore((state) => state.selectedTargetId)
  const targets = useGameStore((state) => state.targets)
  
  const target = selectedTargetId ? targets.get(selectedTargetId) : null

  if (!target) return null

  const hpPercent = Math.max(0, Math.min(100, (target.currentHp / target.maxHp) * 100))

  return (
    <div className="absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none select-none z-50">
      <div className="relative w-80 bg-black/60 border-t-2 border-b-2 border-yellow-500/80 backdrop-blur-sm px-4 py-2 flex items-center justify-between shadow-lg">
        <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-yellow-500 rotate-45 shadow-[0_0_10px_rgba(234,179,8,0.8)]" />
        
        <div className="flex flex-col ml-2">
          <span className="text-sm font-bold text-yellow-100 uppercase tracking-wide drop-shadow-md">{target.name}</span>
          <span className="text-[10px] text-yellow-200/80">Lv. {target.level} • {target.type.toUpperCase()}</span>
        </div>
        
        <div className="flex flex-col items-end gap-1">
           <div className="w-32 h-3 bg-gray-900 border border-gray-600 relative overflow-hidden">
                <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-300"
                    style={{ width: `${hpPercent}%` }}
                />
           </div>
           <span className="text-[10px] font-mono text-white/90">
               {target.currentHp} / {target.maxHp}
           </span>
        </div>

        <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-yellow-500 rotate-45 shadow-[0_0_10px_rgba(234,179,8,0.8)]" />
      </div>
    </div>
  )
}
