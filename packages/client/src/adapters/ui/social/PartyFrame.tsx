import { useMemo } from "react"
import { useGameStore } from "@application/stores/game.store"
import { useSocialStore, type LootMode } from "@application/stores/social.store"
import { usePlayerStore } from "@application/stores/player.store"

const lootModeLabel: Record<LootMode, string> = {
  free_for_all: "Free-for-All",
  round_robin: "Round-Robin",
  leader_distribute: "Leader Distribute",
}

interface PartyFrameProps {
  readonly onCreateParty: () => void
  readonly onLeaveParty: () => void
  readonly onDisbandParty: () => void
  readonly onSetLootMode: (mode: LootMode) => void
  readonly onInvite: (targetPlayerId: string) => void
}

export const PartyFrame = ({
  onCreateParty,
  onLeaveParty,
  onDisbandParty,
  onSetLootMode,
  onInvite,
}: PartyFrameProps) => {
  const currentPlayerId = useGameStore((s) => s.currentCharacter?.id ?? null)
  const selectedTargetId = usePlayerStore((s) => s.selectedTargetId)
  const { partyId, leaderId, members, lootMode, raid } = useSocialStore()

  const isLeader = useMemo(
    () => Boolean(currentPlayerId && leaderId === currentPlayerId),
    [currentPlayerId, leaderId],
  )

  if (!partyId) {
    return (
      <div className="absolute left-4 top-32 z-40 w-72 rounded-md border border-sao-gold/40 bg-sao-panel/90 p-3 text-sm">
        <div className="mb-2 font-game text-sao-gold">Party</div>
        <button
          className="w-full rounded border border-sao-gold/50 bg-black/30 px-3 py-2 text-sao-gold hover:bg-black/50"
          onClick={onCreateParty}
        >
          Create Party
        </button>
      </div>
    )
  }

  return (
    <div className="absolute left-4 top-32 z-40 w-72 rounded-md border border-sao-gold/40 bg-sao-panel/90 p-3 text-xs">
      <div className="mb-2 flex items-center justify-between">
        <div className="font-game text-sao-gold">Party ({members.length}/6)</div>
        <div className="text-[10px] text-gray-400">{lootModeLabel[lootMode]}</div>
      </div>

      <div className="mb-3 space-y-1">
        {members.map((member) => {
          const hpPercent = Math.max(0, Math.min(100, (member.currentHp / Math.max(1, member.maxHp)) * 100))
          const mpPercent = Math.max(0, Math.min(100, (member.currentMp / Math.max(1, member.maxMp)) * 100))

          return (
            <div key={member.playerId} className="rounded border border-black/30 bg-black/30 p-1.5">
              <div className="mb-1 flex items-center justify-between">
                <span className="truncate text-gray-100">
                  {member.name || member.playerId.slice(0, 8)}
                  {member.playerId === leaderId ? " [L]" : ""}
                </span>
                <span className="text-gray-500">Lv.{member.level}</span>
              </div>
              <div className="mb-1 h-1.5 rounded bg-gray-800">
                <div className="h-full rounded bg-red-500" style={{ width: `${hpPercent}%` }} />
              </div>
              <div className="h-1.5 rounded bg-gray-800">
                <div className="h-full rounded bg-blue-500" style={{ width: `${mpPercent}%` }} />
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          className="rounded border border-sao-blue/50 bg-black/30 px-2 py-1 text-sao-blue hover:bg-black/50 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!selectedTargetId}
          onClick={() => {
            if (!selectedTargetId) return
            onInvite(selectedTargetId)
          }}
        >
          Invite
        </button>
        <button
          className="rounded border border-sao-gold/50 bg-black/30 px-2 py-1 text-sao-gold hover:bg-black/50"
          onClick={onLeaveParty}
        >
          Leave
        </button>
        {isLeader ? (
          <button
            className="col-span-2 rounded border border-red-500/50 bg-black/30 px-2 py-1 text-red-300 hover:bg-black/50"
            onClick={onDisbandParty}
          >
            Disband
          </button>
        ) : (
          <div className="col-span-2 rounded border border-black/30 bg-black/20 px-2 py-1 text-center text-gray-500">
            Member
          </div>
        )}
      </div>

      {isLeader ? (
        <div className="mt-2 grid grid-cols-3 gap-1">
          <button className="rounded border border-black/30 px-1 py-1 text-[10px] hover:bg-black/20" onClick={() => onSetLootMode("free_for_all")}>FFA</button>
          <button className="rounded border border-black/30 px-1 py-1 text-[10px] hover:bg-black/20" onClick={() => onSetLootMode("round_robin")}>Round</button>
          <button className="rounded border border-black/30 px-1 py-1 text-[10px] hover:bg-black/20" onClick={() => onSetLootMode("leader_distribute")}>Leader</button>
        </div>
      ) : null}

      {raid ? (
        <div className="mt-2 rounded border border-sao-blue/40 bg-black/20 p-2">
          <div className="mb-1 text-[10px] text-sao-blue">Raid {raid.memberCount}/48</div>
          <div className="max-h-36 space-y-1 overflow-y-auto">
            {raid.members.map((member) => {
              const hpPercent = Math.max(0, Math.min(100, (member.currentHp / Math.max(1, member.maxHp)) * 100))
              return (
                <div key={`raid-${member.playerId}`} className="rounded bg-black/30 px-1.5 py-1">
                  <div className="mb-0.5 flex items-center justify-between text-[10px] text-gray-300">
                    <span className="truncate">{member.name || member.playerId.slice(0, 8)}</span>
                    <span>Lv.{member.level}</span>
                  </div>
                  <div className="h-1 rounded bg-gray-800">
                    <div className="h-full rounded bg-red-500" style={{ width: `${hpPercent}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
