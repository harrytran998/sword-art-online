import { usePlayerStore } from "@application/stores/player.store"
import { useUiStore } from "@application/stores/ui.store"
import type { EquipmentSlotType } from "@sao/server/src/modules/inventory/domain/value-objects/equipment-slot"

export const EquipmentPanel = () => {
  const equipmentOpen = useUiStore((s) => s.equipmentOpen)
  const toggleEquipment = useUiStore((s) => s.toggleEquipment)
  const equipment = usePlayerStore((s) => s.equipment)

  if (!equipmentOpen) return null

  const renderSlot = (label: string, slotType: EquipmentSlotType) => {
    const item = equipment[slotType]
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] uppercase text-gray-500">{label}</span>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            const dataStr = e.dataTransfer.getData("application/json")
            if (!dataStr) return
            try {
              const data = JSON.parse(dataStr)
              if (data.type === "inventory") {
                usePlayerStore.getState().equipItem(data.slotIndex, slotType)
              }
            } catch (err) { }
          }}
          draggable={!!item}
          onDragStart={(e) => {
            if (!item) return
            e.dataTransfer.setData(
              "application/json",
              JSON.stringify({ type: "equipment", slotType })
            )
          }}
          className="relative flex h-14 w-14 cursor-pointer items-center justify-center rounded border border-gray-700 bg-black/50 hover:border-sao-gold"
        >
          {item ? <div className="h-10 w-10 bg-sao-gold/50" /> : null}
        </div>
      </div>
    )
  }

  return (
    <div className="absolute right-88 top-24 z-40 w-64 rounded-lg border border-sao-gold bg-sao-panel shadow-lg">
      <div className="flex items-center justify-between border-b border-sao-gold/30 bg-black/40 px-4 py-2">
        <h2 className="font-game text-lg text-sao-gold">Equipment</h2>
        <button
          onClick={toggleEquipment}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
      
      <div className="flex flex-col items-center gap-4 p-4">
        {/* Head */}
        {renderSlot("Head", "head")}
        
        {/* Chest, Hands */}
        <div className="flex gap-4">
          {renderSlot("Hands", "hands")}
          {renderSlot("Chest", "chest")}
          {/* Main Hand / Off Hand could go here in a more complex layout, but let's keep it simple */}
        </div>

        {/* Legs */}
        {renderSlot("Legs", "legs")}

        {/* Feet */}
        {renderSlot("Feet", "feet")}

        {/* Weapons */}
        <div className="mt-2 flex gap-8">
          {renderSlot("Main Hand", "main_hand")}
          {renderSlot("Off Hand", "off_hand")}
        </div>
      </div>
    </div>
  )
}
