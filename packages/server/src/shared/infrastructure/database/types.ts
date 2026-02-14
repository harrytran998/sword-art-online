import type { Generated } from "kysely"

export interface AccountTable {
  id: Generated<string>
  email: string
  username: string
  password_hash: string
  status: "active" | "banned" | "suspended"
  created_at: Generated<Date>
  updated_at: Generated<Date>
}

export interface CharacterTable {
  id: Generated<string>
  account_id: string
  name: string
  level: number
  experience: number
  current_hp: number
  max_hp: number
  current_floor: number
  col: number
  is_alive: boolean
  created_at: Generated<Date>
  updated_at: Generated<Date>
}

export interface CharacterStatsTable {
  character_id: string
  str: number
  agi: number
  vit: number
  dex: number
  int: number
  lck: number
  unallocated_points: number
  updated_at: Generated<Date>
}

export interface BetterAuthUserTable {
  id: string
  email: string
  name: string | null
  email_verified: boolean
  image: string | null
  created_at: Generated<Date>
  updated_at: Generated<Date>
}

export interface BetterAuthSessionTable {
  id: string
  expires_at: Date
  token: string
  created_at: Generated<Date>
  updated_at: Generated<Date>
  ip_address: string | null
  user_agent: string | null
  user_id: string
}

export interface BetterAuthAccountTable {
  id: string
  account_id: string
  provider_id: string
  user_id: string
  access_token: string | null
  refresh_token: string | null
  id_token: string | null
  access_token_expires_at: Date | null
  refresh_token_expires_at: Date | null
  scope: string | null
  password: string | null
  created_at: Generated<Date>
  updated_at: Generated<Date>
}

export interface BetterAuthVerificationTable {
  id: string
  identifier: string
  value: string
  expires_at: Date
  created_at: Date | null
  updated_at: Date | null
}

export interface Database {
  "sao.accounts": AccountTable
  "sao.characters": CharacterTable
  "sao.character_stats": CharacterStatsTable
  "sao.user": BetterAuthUserTable
  "sao.session": BetterAuthSessionTable
  "sao.account": BetterAuthAccountTable
  "sao.verification": BetterAuthVerificationTable
}
