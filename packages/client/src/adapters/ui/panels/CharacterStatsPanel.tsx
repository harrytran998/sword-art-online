import { usePlayerStore } from "@application/stores/player.store"
import { useUiStore } from "@application/stores/ui.store"

export const CharacterStatsPanel = () => {
  const isCharacterOpen = useUiStore((s) => s.characterOpen)
  const toggleCharacter = useUiStore((s) => s.toggleCharacter)
  const currentCharacter = usePlayerStore((s) => ({
    hp: s.hp, maxHp: s.maxHp, mp: s.mp, maxMp: s.maxMp, level: 1 // Stub level
  }))

  if (!isCharacterOpen) return null

  // In a full implementation, this would aggregate base stats + equipment stats
  const stats = {
    str: 10,
    dex: 15,
    int: 5,
    vit: 12,
    agi: 14,
  }

  return (
    <div className="absolute left-152 top-24 z-40 w-64 rounded-lg border border-sao-gold bg-sao-panel shadow-lg">
      <div className="flex items-center justify-between border-b border-sao-gold/30 bg-black/40 px-4 py-2">
        <h2 className="font-game text-lg text-sao-gold">Character Status</h2>
        <button
          onClick={toggleCharacter}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
      
      <div className="flex flex-col gap-4 p-4 text-sm text-gray-200">
        <div className="flex flex-col gap-1 border-b border-gray-600 pb-3">
          <div className="flex justify-between">
            <span className="text-gray-400">Level</span>
            <span className="font-bold text-sao-gold">{currentCharacter.level}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">HP</span>
            <span>{currentCharacter.hp} / {currentCharacter.maxHp}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">SP</span>
            <span>{currentCharacter.mp} / {currentCharacter.maxMp}</span>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          {Object.entries(stats).map(([stat, val]) => (
            <div key={stat} className="flex justify-between">
              <span className="text-gray-400 uppercase">{stat}</span>
              <span>{val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
