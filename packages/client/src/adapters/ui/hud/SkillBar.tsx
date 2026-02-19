import { usePlayerStore } from "@application/stores/player.store"
import React from "react"

const getSkillColor = (skillId: number) => {
  const colors = [
    "bg-red-500", "bg-blue-500", "bg-green-500", 
    "bg-yellow-500", "bg-purple-500", "bg-pink-500", 
    "bg-indigo-500", "bg-teal-500", "bg-orange-500"
  ]
  return colors[skillId % colors.length] || "bg-gray-500"
}

export const SkillBar: React.FC = () => {
  const skills = usePlayerStore((state) => state.skills)

  const slots = Array.from({ length: 9 }, (_, i) => {
    const skill = skills.find(s => s.slotIndex === i)
    return {
      key: i + 1,
      skill
    }
  })

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-black/60 rounded-lg backdrop-blur-sm border border-gray-600 z-50">
      {slots.map((slot) => {
        const { skill } = slot
        const isCooldown = skill && skill.currentCooldown > 0

        return (
          <div 
            key={slot.key}
            className="relative w-12 h-12 bg-gray-800 border border-gray-600 rounded cursor-pointer hover:border-gray-400 transition-colors group"
            onClick={() => {
              if (skill) {
                window.dispatchEvent(new CustomEvent('ui:activate-skill', { detail: { skillId: skill.skillId } }))
              }
            }}
          >
            <div className="absolute top-0 right-1 text-[10px] text-gray-400 font-bold z-20">
              {slot.key}
            </div>

            {skill ? (
              <>
                <div className={`w-full h-full ${getSkillColor(skill.skillId)} opacity-80 group-hover:opacity-100 transition-opacity`} />
                
                {isCooldown && (
                  <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
                    <span className="text-xs font-bold text-white">
                      {Math.ceil(skill.currentCooldown / 1000)}
                    </span>
                  </div>
                )}
                
                {skill.isActive && (
                  <div className="absolute inset-0 border-2 border-yellow-400 animate-pulse z-20" />
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center opacity-20">
                <div className="w-8 h-8 border-2 border-dashed border-gray-500 rounded-full" />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
