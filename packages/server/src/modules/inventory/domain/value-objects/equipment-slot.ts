export type EquipmentSlotType = 
  | 'main_hand' | 'off_hand' | 'head' | 'chest' 
  | 'hands' | 'legs' | 'feet' 
  | 'accessory1' | 'accessory2' | 'accessory3'

export const EQUIPMENT_SLOTS: EquipmentSlotType[] = [
  'main_hand', 'off_hand', 'head', 'chest',
  'hands', 'legs', 'feet',
  'accessory1', 'accessory2', 'accessory3'
]

export const SLOT_INDEX_MAP: Record<EquipmentSlotType, number> = {
  main_hand: 0,
  off_hand: 1,
  head: 2,
  chest: 3,
  hands: 4,
  legs: 5,
  feet: 6,
  accessory1: 7,
  accessory2: 8,
  accessory3: 9,
}

export const isEquipmentSlot = (slot: string): slot is EquipmentSlotType => {
  return EQUIPMENT_SLOTS.includes(slot as EquipmentSlotType)
}

export const getSlotByIndex = (index: number): EquipmentSlotType | null => {
  for (const [slot, idx] of Object.entries(SLOT_INDEX_MAP)) {
    if (idx === index) return slot as EquipmentSlotType
  }
  return null
}
