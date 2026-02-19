import { usePlayerStore } from "@application/stores/player.store"
import React from "react"

export const HpMpBars: React.FC = () => {
  const { hp, maxHp, mp, maxMp } = usePlayerStore()

  const hpPercent = Math.max(0, Math.min(100, (hp / maxHp) * 100))
  const mpPercent = Math.max(0, Math.min(100, (mp / maxMp) * 100))

  return (
    <div className="absolute top-4 left-4 flex flex-col gap-1 w-72 pointer-events-none select-none z-50">
      <div className="relative h-5 bg-black/60 border border-gray-500 rounded-sm skew-x-[-15deg] shadow-lg">
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-700 via-red-500 to-red-400 transition-all duration-200"
          style={{ width: `${hpPercent}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-between px-3 skew-x-[15deg]">
            <span className="text-[10px] font-bold text-red-200 uppercase tracking-widest drop-shadow-md">HP</span>
            <span className="text-xs font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                {hp} / {maxHp}
            </span>
        </div>
      </div>

      <div className="relative h-3 bg-black/60 border border-gray-500 rounded-sm skew-x-[-15deg] w-4/5 shadow-lg">
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-700 via-blue-500 to-blue-400 transition-all duration-200"
          style={{ width: `${mpPercent}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-between px-3 skew-x-[15deg]">
             <span className="text-[8px] font-bold text-blue-200 uppercase tracking-widest drop-shadow-md">MP</span>
             <span className="text-[10px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                {mp} / {maxMp}
             </span>
        </div>
      </div>
    </div>
  )
}
