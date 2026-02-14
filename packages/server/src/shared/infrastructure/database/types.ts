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

export interface Database {
  "sao.accounts": AccountTable
  "sao.characters": CharacterTable
  "sao.character_stats": CharacterStatsTable
}
