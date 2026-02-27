import { create } from "zustand"

export type LootMode = "free_for_all" | "round_robin" | "leader_distribute"

export interface PartyMemberState {
  readonly playerId: string
  readonly name: string
  readonly level: number
  readonly currentHp: number
  readonly maxHp: number
  readonly currentMp: number
  readonly maxMp: number
  readonly x: number
  readonly z: number
}

export interface PartyInviteState {
  readonly inviteId: string
  readonly partyId: string
  readonly leaderId: string
}

export interface RaidState {
  readonly raidId: string
  readonly leaderId: string
  readonly partyIds: readonly string[]
  readonly memberCount: number
  readonly members: readonly PartyMemberState[]
}

interface SocialState {
  partyId: string | null
  leaderId: string | null
  lootMode: LootMode
  members: PartyMemberState[]
  invites: PartyInviteState[]
  raid: RaidState | null
  chatMessages: Array<{
    id: string
    senderId: string
    senderName: string
    channel: string
    message: string
    timestamp: number
  }>

  setPartyState: (state: {
    partyId: string
    leaderId: string
    lootMode: LootMode
    members: PartyMemberState[]
  }) => void
  clearParty: () => void
  addInvite: (invite: PartyInviteState) => void
  removeInvite: (inviteId: string) => void
  setRaidState: (raid: RaidState | null) => void
  addChatMessage: (msg: {
    senderId: string
    senderName: string
    channel: string
    message: string
    timestamp: number
  }) => void
}

export const useSocialStore = create<SocialState>((set) => ({
  partyId: null,
  leaderId: null,
  lootMode: "free_for_all",
  members: [],
  invites: [],
  raid: null,
  chatMessages: [],

  setPartyState: ({ partyId, leaderId, lootMode, members }) =>
    set({
      partyId,
      leaderId,
      lootMode,
      members,
    }),

  clearParty: () =>
    set({
      partyId: null,
      leaderId: null,
      lootMode: "free_for_all",
      members: [],
      raid: null,
    }),

  addInvite: (invite) =>
    set((state) => ({
      invites: state.invites.some((item) => item.inviteId === invite.inviteId)
        ? state.invites
        : [...state.invites, invite],
    })),

  removeInvite: (inviteId) =>
    set((state) => ({
      invites: state.invites.filter((invite) => invite.inviteId !== inviteId),
    })),

  setRaidState: (raid) => set({ raid }),

  addChatMessage: (msg) =>
    set((state) => ({
      chatMessages: [
        ...state.chatMessages.slice(-199),
        {
          id: `${msg.timestamp}:${msg.senderId}:${Math.random().toString(36).slice(2, 6)}`,
          ...msg,
        },
      ],
    })),
}))
