/**
 * NetworkPort — interface for server communication.
 * Adapters: WebSocketAdapter
 */
export interface NetworkPort {
  readonly connect: (url: string, token: string) => void
  readonly disconnect: () => void
  readonly send: (message: Record<string, unknown>) => void
  readonly onMessage: (handler: (data: unknown) => void) => () => void
  readonly onDisconnect: (handler: () => void) => () => void
  readonly isConnected: () => boolean
}
