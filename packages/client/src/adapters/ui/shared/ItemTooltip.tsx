import type { InventorySlot } from "@sao/server/src/modules/inventory/domain/entities/inventory-slot"
import type { ItemRarity } from "@sao/server/src/shared/infrastructure/database/types"

interface ItemTooltipProps {
  item: InventorySlot
  x: number
  y: number
}

const getRarityColor = (rarity: ItemRarity) => {
  switch (rarity) {
    case "common": return "text-white"
    case "uncommon": return "text-green-400"
    case "rare": return "text-blue-400"
    case "epic": return "text-purple-400"
    case "legendary": return "text-yellow-400"
    default: return "text-gray-400"
  }
}

export const ItemTooltip = ({ item, x, y }: ItemTooltipProps) => {
  const def = item.itemDefinition

  return (
    <div
      className="pointer-events-none fixed z-50 flex w-64 flex-col gap-2 rounded border border-sao-gold/50 bg-sao-panel/95 p-3 shadow-2xl"
      style={{ left: x + 15, top: y + 15 }}
    >
      <div className="flex flex-col border-b border-gray-600 pb-2">
        <span className={`font-bold ${getRarityColor(def.rarity)}`}>
          {def.name} {item.enhancementLevel > 0 ? `+${item.enhancementLevel}` : ""}
        </span>
        <span className="text-xs text-gray-400 capitalize">{def.category}</span>
      </div>

      <p className="text-sm italic text-gray-300">{def.description}</p>

      {def.stats && Object.keys(def.stats).length > 0 && (
        <div className="flex flex-col gap-0.5 pt-1 text-sm text-sao-green">
          {Object.entries(def.stats).map(([stat, val]) => (
            <span key={stat}>
              {stat.toUpperCase()}: +{val}
            </span>
          ))}
        </div>
      )}

      {def.requirements && Object.keys(def.requirements).length > 0 && (
        <div className="flex flex-col gap-0.5 border-t border-gray-600 pt-2 text-xs text-red-400">
          <span className="text-gray-400">Requires:</span>
          {Object.entries(def.requirements).map(([req, val]) => (
            <span key={req}>
              {req.toUpperCase()}: {val}
            </span>
          ))}
        </div>
      )}

      <div className="mt-2 text-right text-xs text-sao-gold">
        Sell Value: {Math.floor(def.basePrice / 2)} Col
      </div>
    </div>
  )
}
