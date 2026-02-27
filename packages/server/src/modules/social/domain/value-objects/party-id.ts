import { PartyId } from "../../../../shared/kernel/types"

export const createPartyId = (): PartyId =>
  PartyId(`party_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`)
