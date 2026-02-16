import { useState } from "react"
import { CLASS_DEFINITIONS, type ClassDefinition } from "@sao/shared"

interface CharacterCreateProps {
  readonly onCreateCharacter: (name: string, classId: number) => void
}

const STAT_LABELS = ["STR", "AGI", "VIT", "DEX", "INT", "LCK"] as const
const STAT_KEYS = ["str", "agi", "vit", "dex", "int", "lck"] as const

export const CharacterCreate = ({ onCreateCharacter }: CharacterCreateProps) => {
  const [name, setName] = useState("")
  const [selectedClass, setSelectedClass] = useState<ClassDefinition>(CLASS_DEFINITIONS[0]!)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (trimmed.length < 3 || trimmed.length > 20) {
      setError("Name must be 3-20 characters")
      return
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      setError("Name can only contain letters, numbers, and underscores")
      return
    }
    setError(null)
    onCreateCharacter(trimmed, selectedClass.id)
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-sao-dark">
      <div className="w-full max-w-2xl px-6">
        <h1 className="mb-2 text-center font-game text-4xl font-bold text-sao-blue">
          Create Character
        </h1>
        <p className="mb-8 text-center text-sm text-gray-400">
          Choose your name and class to begin your adventure in Aincrad
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name input */}
          <div>
            <label className="mb-1 block text-sm text-gray-300">
              Character Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError(null)
              }}
              placeholder="Enter your character name..."
              maxLength={20}
              className="w-full rounded border border-sao-blue/30 bg-sao-panel px-4 py-2.5 text-white placeholder:text-gray-600 focus:border-sao-blue focus:outline-none"
            />
            {error && (
              <p className="mt-1 text-xs text-red-400">{error}</p>
            )}
          </div>

          {/* Class selection grid */}
          <div>
            <label className="mb-2 block text-sm text-gray-300">
              Select Class
            </label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {CLASS_DEFINITIONS.map((cls) => (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => setSelectedClass(cls)}
                  className={`rounded border p-3 text-left transition-colors ${
                    selectedClass.id === cls.id
                      ? "border-sao-blue bg-sao-blue/10"
                      : "border-gray-700 bg-sao-panel hover:border-gray-500"
                  }`}
                >
                  <div className="text-sm font-semibold text-white">
                    {cls.name}
                  </div>
                  <div className="mt-0.5 text-xs text-gray-400">
                    {cls.weaponType}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Selected class preview */}
          <div className="rounded border border-sao-blue/20 bg-sao-panel p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-sao-blue">
                {selectedClass.name}
              </h3>
              <span className="text-xs text-gray-400">
                {selectedClass.weaponType}
              </span>
            </div>
            <p className="mb-3 text-xs text-gray-400">
              {selectedClass.description}
            </p>

            {/* Stats display */}
            <div className="grid grid-cols-3 gap-2">
              {STAT_LABELS.map((label, i) => {
                const key = STAT_KEYS[i]!
                const value = selectedClass.stats[key]
                return (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded bg-sao-dark/50 px-2 py-1"
                  >
                    <span className="text-xs text-gray-400">{label}</span>
                    <div className="flex items-center gap-1">
                      <div className="h-1.5 w-12 overflow-hidden rounded-full bg-gray-700">
                        <div
                          className="h-full rounded-full bg-sao-blue"
                          style={{ width: `${(value / 15) * 100}%` }}
                        />
                      </div>
                      <span className="w-5 text-right text-xs text-white">
                        {value}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={name.trim().length < 3}
            className="w-full rounded bg-sao-blue py-3 font-semibold text-white transition-colors hover:bg-sao-blue/80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Create Character
          </button>
        </form>
      </div>
    </div>
  )
}
