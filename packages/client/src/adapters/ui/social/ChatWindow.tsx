import { useMemo, useState } from "react"
import { useSocialStore } from "@application/stores/social.store"

interface ChatWindowProps {
  readonly onSend: (channel: string, message: string) => void
}

const tabs = ["say", "party", "raid", "guild", "whisper", "world", "trade"] as const

export const ChatWindow = ({ onSend }: ChatWindowProps) => {
  const [active, setActive] = useState<(typeof tabs)[number]>("say")
  const [value, setValue] = useState("")
  const messages = useSocialStore((s) => s.chatMessages)

  const visibleMessages = useMemo(
    () =>
      messages.filter((msg) => {
        if (active === "say") return msg.channel === "say" || msg.channel === "shout"
        return msg.channel === active
      }),
    [messages, active],
  )

  return (
    <div className="absolute bottom-4 left-4 z-40 w-[28rem] rounded-md border border-sao-gold/40 bg-sao-panel/90">
      <div className="flex border-b border-sao-gold/20">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`px-3 py-1.5 text-xs uppercase ${
              active === tab ? "bg-black/30 text-sao-gold" : "text-gray-400 hover:text-gray-200"
            }`}
            onClick={() => setActive(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="h-36 overflow-y-auto px-3 py-2 text-xs">
        {visibleMessages.map((msg) => (
          <div key={msg.id} className="mb-1 text-gray-200">
            <span className="text-gray-500">[{msg.channel}]</span>{" "}
            <span className="text-sao-gold">{msg.senderName || msg.senderId.slice(0, 8)}</span>: {msg.message}
          </div>
        ))}
      </div>

      <form
        className="flex gap-2 border-t border-sao-gold/20 p-2"
        onSubmit={(e) => {
          e.preventDefault()
          const text = value.trim()
          if (!text) return
          onSend(active, text)
          setValue("")
        }}
      >
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={500}
          className="flex-1 rounded border border-gray-700 bg-black/30 px-2 py-1 text-xs text-gray-100 outline-none focus:border-sao-gold/50"
          placeholder={`Message #${active}`}
        />
        <button
          className="rounded border border-sao-gold/50 px-3 py-1 text-xs text-sao-gold hover:bg-black/30"
          type="submit"
        >
          Send
        </button>
      </form>
    </div>
  )
}
