import type { ZoneId } from "../../../shared/kernel/types"

// Anti-crystal zones: teleport crystals are disabled
const antiCrystalZones = new Set<string>()

export const disableTeleportInZone = (zoneId: ZoneId): void => {
  antiCrystalZones.add(zoneId)
}

export const enableTeleportInZone = (zoneId: ZoneId): void => {
  antiCrystalZones.delete(zoneId)
}

export const isTeleportDisabled = (zoneId: ZoneId): boolean => {
  return antiCrystalZones.has(zoneId)
}
