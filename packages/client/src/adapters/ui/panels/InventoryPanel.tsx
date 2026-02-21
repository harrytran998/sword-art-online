import { useState } from "react"
import { usePlayerStore } from "@application/stores/player.store"
import { useUiStore } from "@application/stores/ui.store"
import { ItemTooltip } from "../shared/ItemTooltip"
import type { InventorySlot } from "@sao/server/src/modules/inventory/domain/entities/inventory-slot"

export const InventoryPanel = () => {
  const inventoryOpen = useUiStore((s) => s.inventoryOpen)
  const toggleInventory = useUiStore((s) => s.toggleInventory)
  const inventory = usePlayerStore((s) => s.inventory)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; slotIndex: number; hasItem: boolean } | null>(null)
  const [hoveredItem, setHoveredItem] = useState<{ item: InventorySlot, x: number, y: number } | null>(null)

  if (!inventoryOpen) return null

  // Ensure 40 slots are always rendered
  const slots = Array.from({ length: 40 }).map((_, i) => {
    return inventory.find((item) => item.slotIndex === i) ?? null
  })

  return (
    <div className="absolute right-8 top-24 z-40 w-80 rounded-lg border border-sao-gold bg-sao-panel shadow-lg">
      <div className="flex items-center justify-between border-b border-sao-gold/30 bg-black/40 px-4 py-2">
        <h2 className="font-game text-lg text-sao-gold">Inventory</h2>
        <button
          onClick={toggleInventory}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
      <div
        className="p-4"
        onClick={() => setContextMenu(null)}
      >
        <div className="grid grid-cols-5 gap-2 relative">
          {slots.map((slot, i) => (
            <div
              key={`slot-${i}`}
              onContextMenu={(e) => {
                e.preventDefault()
                setContextMenu({ x: e.clientX, y: e.clientY, slotIndex: i, hasItem: !!slot })
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const dataStr = e.dataTransfer.getData("application/json")
                if (!dataStr) return
                try {
                  const data = JSON.parse(dataStr)
                  if (data.type === "inventory") {
                    if (data.slotIndex !== i) {
                      usePlayerStore.getState().moveInventoryItem(data.slotIndex, i)
                    }
                  } else if (data.type === "equipment") {
                    usePlayerStore.getState().unequipItem(data.slotType, i)
                  }
                } catch (err) {
                  // ignore parse error
                }
              }}
              draggable={!!slot}
              onMouseEnter={(e) => {
                if (slot) setHoveredItem({ item: slot, x: e.clientX, y: e.clientY })
              }}
              onMouseMove={(e) => {
                if (slot && hoveredItem) setHoveredItem({ item: slot, x: e.clientX, y: e.clientY })
              }}
              onMouseLeave={() => setHoveredItem(null)}
              onDragStart={(e) => {
                if (!slot) return
                e.dataTransfer.setData(
                  "application/json",
                  JSON.stringify({ type: "inventory", slotIndex: i })
                )
              }}
              className="relative flex h-12 w-12 cursor-pointer items-center justify-center rounded border border-gray-700 bg-black/50 hover:border-sao-gold"
            >
              {slot ? (
                <>
                  <div className="h-8 w-8 bg-sao-blue/50" /> {/* Placeholder icon */}
                  {slot.quantity > 1 && (
                    <span className="absolute bottom-0 right-1 text-[10px] text-white">
                      {slot.quantity}
                    </span>
                  )}
                </>
              ) : null}
            </div>
          ))}

          {/* Context Menu */}
          {contextMenu && contextMenu.hasItem && (
            <div
              className="fixed z-50 flex flex-col overflow-hidden rounded border border-sao-gold/50 bg-sao-panel/95 py-1 shadow-lg"
              style={{ top: contextMenu.y, left: contextMenu.x }}
            >
              <button
                className="px-4 py-1.5 text-left text-sm text-gray-200 hover:bg-sao-blue/50"
                onClick={(e) => {
                  e.stopPropagation()
                  usePlayerStore.getState().useItem(contextMenu.slotIndex)
                  setContextMenu(null)
                }}
              >
                Use
              </button>
              <button
                className="px-4 py-1.5 text-left text-sm text-gray-200 hover:bg-sao-blue/50"
                onClick={(e) => {
                  e.stopPropagation()
                  // Temporary hack, ideally we lookup the proper equipment slot
                  usePlayerStore.getState().equipItem(contextMenu.slotIndex, "main_hand")
                  setContextMenu(null)
                }}
              >
                Equip
              </button>
              <div className="my-1 h-px w-full bg-sao-gold/20" />
              <button
                className="px-4 py-1.5 text-left text-sm text-red-400 hover:bg-red-900/50"
                onClick={(e) => {
                  e.stopPropagation()
                  usePlayerStore.getState().dropItem(contextMenu.slotIndex)
                  setContextMenu(null)
                }}
              >
                Drop
              </button>
            </div>
          )}

          {/* Tooltip */}
          {hoveredItem && !contextMenu && <ItemTooltip item={hoveredItem.item} x={hoveredItem.x} y={hoveredItem.y} />}
        </div>
      </div>
    </div>
  )
}
