import type { StoragePort } from "@ports/storage.port"

const PREFIX = "sao:"

export const createLocalStorageAdapter = (): StoragePort => ({
  get: <T>(key: string): T | null => {
    const raw = localStorage.getItem(`${PREFIX}${key}`)
    if (!raw) return null
    try {
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  },

  set: <T>(key: string, value: T): void => {
    localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value))
  },

  remove: (key: string): void => {
    localStorage.removeItem(`${PREFIX}${key}`)
  },

  clear: (): void => {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith(PREFIX))
    keys.forEach((k) => localStorage.removeItem(k))
  },
})
