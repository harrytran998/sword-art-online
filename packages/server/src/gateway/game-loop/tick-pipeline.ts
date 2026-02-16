import { Effect } from "effect"

/**
 * Per-tick processing pipeline (60Hz):
 * 1. Process input queue — no-op (inputs routed directly in WS message handler)
 * 2. Update movement — no-op (movement handled per-input, not per-tick)
 * 3. Combat — placeholder
 * 4. Monster AI — placeholder
 * 5. Collisions — placeholder
 * 6. Anti-cheat — placeholder
 * 7. Broadcast state — TODO: broadcast every N ticks
 * 8. Increment tick counter — handled in game-loop.ts
 */
export const processTick = (_deltaMs: number): Effect.Effect<void> =>
  // Sprint 3: All processing happens in message handlers.
  // State broadcasts are handled by gateway subscriptions reacting to events.
  // Future sprints will add combat, AI, and collision stages here.
  Effect.void
