/**
 * StoragePort — interface for client-side persistence.
 * Adapters: LocalStorageAdapter
 */
export interface StoragePort {
  readonly get: <T>(key: string) => T | null
  readonly set: <T>(key: string, value: T) => void
  readonly remove: (key: string) => void
  readonly clear: () => void
}
