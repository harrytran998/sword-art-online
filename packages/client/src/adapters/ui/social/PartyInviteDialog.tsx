import { useSocialStore } from "@application/stores/social.store"

interface PartyInviteDialogProps {
  readonly onRespond: (inviteId: string, accept: boolean) => void
}

export const PartyInviteDialog = ({ onRespond }: PartyInviteDialogProps) => {
  const invites = useSocialStore((s) => s.invites)

  if (invites.length === 0) return null

  const invite = invites[0]
  if (!invite) return null

  return (
    <div className="absolute left-1/2 top-20 z-50 w-96 -translate-x-1/2 rounded-md border border-sao-gold/60 bg-sao-panel p-4 shadow-xl">
      <div className="mb-3 font-game text-lg text-sao-gold">Party Invite</div>
      <p className="mb-4 text-sm text-gray-300">
        Leader <span className="text-white">{invite.leaderId}</span> invited you to party.
      </p>
      <div className="flex justify-end gap-2">
        <button
          className="rounded border border-gray-600 px-3 py-1.5 text-gray-300 hover:bg-black/20"
          onClick={() => onRespond(invite.inviteId, false)}
        >
          Decline
        </button>
        <button
          className="rounded border border-sao-gold/60 bg-black/20 px-3 py-1.5 text-sao-gold hover:bg-black/40"
          onClick={() => onRespond(invite.inviteId, true)}
        >
          Accept
        </button>
      </div>
    </div>
  )
}
