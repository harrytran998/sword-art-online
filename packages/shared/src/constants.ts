/**
 * Game constants shared between server and client.
 */

// Floors
export const TOTAL_FLOORS = 100
export const STARTING_FLOOR = 1

// Character
export const MAX_LEVEL = 100
export const STARTING_LEVEL = 1
export const BASE_HP = 100
export const HP_PER_VIT = 10
export const STAT_POINTS_PER_LEVEL = 5
export const MAX_STAT_VALUE = 999

// Base stats
export const BASE_STATS = {
  STR: 1,
  AGI: 1,
  VIT: 1,
  DEX: 1,
  INT: 1,
  LCK: 1,
} as const

// Combat
export const TICK_RATE = 60
export const COMBAT_RANGE_MELEE = 2.5
export const COMBAT_RANGE_SPEAR = 4.0
export const COMBAT_RANGE_BOW = 15.0
export const CRITICAL_HIT_BASE_CHANCE = 0.05

// Party
export const MAX_PARTY_SIZE = 6
export const MAX_RAID_PARTIES = 8
export const MAX_RAID_SIZE: number = MAX_PARTY_SIZE * MAX_RAID_PARTIES // 48

// Economy
export const STARTING_COL = 0
export const TRADE_TAX_RATE = 0.05
export const AUCTION_MINIMUM_BID = 1
export const AUCTION_MAX_DURATION_HOURS = 72

// Movement
export const MAX_MOVE_SPEED = 10.0
export const SPRINT_MULTIPLIER = 1.5
export const TELEPORT_MAX_DISTANCE = 0.5 // Threshold for detecting teleport hacks

// WebSocket
export const WS_HEARTBEAT_INTERVAL_MS = 30000
export const WS_MAX_PAYLOAD_BYTES = 65536
export const WS_MESSAGE_RATE_LIMIT = 60 // messages per second

// Rate Limits (per player)
export const RATE_LIMIT_MOVEMENT_MAX = 20
export const RATE_LIMIT_MOVEMENT_WINDOW_S = 1
export const RATE_LIMIT_CHAT_MAX = 10
export const RATE_LIMIT_CHAT_WINDOW_S = 10
export const RATE_LIMIT_SKILL_MAX = 5
export const RATE_LIMIT_SKILL_WINDOW_S = 1
export const RATE_LIMIT_GLOBAL_MAX = 100
export const RATE_LIMIT_GLOBAL_WINDOW_S = 1

// Heartbeat
export const HEARTBEAT_CLIENT_INTERVAL_MS = 10000
export const HEARTBEAT_TIMEOUT_MS = 30000

// Anti-cheat
export const SUSPICION_THRESHOLD = 100
export const SUSPICION_SPEED_HACK_PENALTY = 25
export const SUSPICION_TELEPORT_PENALTY = 50
