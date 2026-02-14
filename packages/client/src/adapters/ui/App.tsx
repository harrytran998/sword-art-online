import { useGameStore } from "@application/stores/game.store.js"

export const App = () => {
  const connectionStatus = useGameStore((s) => s.connectionStatus)

  return (
    <div className="flex h-full w-full items-center justify-center bg-sao-dark">
      <div className="text-center">
        <h1 className="mb-4 font-game text-6xl font-bold text-sao-blue">
          Sword Art Online
        </h1>
        <p className="mb-8 text-lg text-gray-400">
          Sword Art Online — Browser MMORPG
        </p>
        <div className="rounded-lg border border-sao-blue/20 bg-sao-panel p-6">
          <p className="text-sm text-gray-300">
            Status:{" "}
            <span
              className={
                connectionStatus === "connected"
                  ? "text-sao-green"
                  : "text-sao-gold"
              }
            >
              {connectionStatus}
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
