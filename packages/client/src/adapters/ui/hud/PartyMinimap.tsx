import { useGameStore } from "@application/stores/game.store"
import { useSocialStore } from "@application/stores/social.store"

const MAP_SIZE = 112
const SCALE = 0.25

export const PartyMinimap = () => {
  const current = useGameStore((s) => s.currentPosition)
  const members = useSocialStore((s) => s.members)

  if (!current || members.length === 0) return null

  return (
    <div className="absolute right-4 bottom-20 z-40 rounded-md border border-sao-gold/40 bg-sao-panel/85 p-2">
      <div className="mb-1 text-[10px] uppercase tracking-wide text-sao-gold">Party Minimap</div>
      <div className="relative h-28 w-28 overflow-hidden rounded border border-black/40 bg-black/40">
        {members.map((member) => {
          const dx = (member.x - current.x) * SCALE
          const dz = (member.z - current.z) * SCALE
          const x = Math.max(2, Math.min(MAP_SIZE - 6, MAP_SIZE / 2 + dx))
          const y = Math.max(2, Math.min(MAP_SIZE - 6, MAP_SIZE / 2 + dz))

          return (
            <div
              key={member.playerId}
              title={member.name || member.playerId}
              className="absolute h-1.5 w-1.5 rounded-full bg-sao-blue"
              style={{ left: `${x}px`, top: `${y}px` }}
            />
          )
        })}

        <div
          className="absolute h-2 w-2 rounded-full bg-sao-gold"
          style={{ left: `${MAP_SIZE / 2}px`, top: `${MAP_SIZE / 2}px` }}
        />
      </div>
    </div>
  )
}
