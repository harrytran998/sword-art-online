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

export interface JwksTable {
  id: string
  publicKey: string
  privateKey: string
  createdAt: Generated<Date>
  expiresAt: Date | null
}

export interface FloorDefinitionTable {
  id: number
  name: string
  description: string
  level_requirement: number
  is_unlocked: boolean
  created_at: Generated<Date>
  updated_at: Generated<Date>
}

export interface ZoneDefinitionTable {
  id: string
  floor_id: number
  name: string
  description: string
  zone_type: "town" | "field" | "forest" | "labyrinth" | "boss"
  is_safe_zone: boolean
  min_x: number
  min_z: number
  max_x: number
  max_z: number
  spawn_x: number
  spawn_y: number
  spawn_z: number
  max_players: number
  created_at: Generated<Date>
  updated_at: Generated<Date>
}

export type WeaponType = "one_handed_sword" | "rapier" | "dagger" | "two_handed_sword" | "spear" | "bow" | "fist"

export interface SkillDefinitionTable {
  id: Generated<number>
  name: string
  weapon_type: WeaponType
  level_req: number
  hits: number
  damage_multiplier: number
  mp_cost: number
  cooldown_ms: number
  range: number
  pre_motion_ms: number
  execution_ms: number
  post_motion_ms: number
  created_at: Generated<Date>
  updated_at: Generated<Date>
}

export interface CharacterSkillTable {
  character_id: string
  skill_id: number
  level: number
  proficiency: number
  slot_index: number | null
  created_at: Generated<Date>
  updated_at: Generated<Date>
}

export type MonsterType = "beast" | "humanoid" | "undead" | "elemental" | "demon" | "boss"

export interface MonsterDefinitionTable {
  id: Generated<number>
  name: string
  monster_type: MonsterType
  level: number
  hp: number
  attack: number
  defense: number
  exp_reward: number
  col_min: number
  col_max: number
  loot_table_id: number | null
  aggro_range: number
  patrol_range: number
  respawn_time_ms: number
  attack_range: number
  attackCooldown_ms: number
  created_at: Generated<Date>
  updated_at: Generated<Date>
}

export interface MonsterSpawnTable {
  id: Generated<number>
  monster_def_id: number
  zone_id: string
  spawn_x: number
  spawn_y: number
  spawn_z: number
  spawn_count: number
  spawn_radius: number
  is_active: boolean
  created_at: Generated<Date>
  updated_at: Generated<Date>
}

export interface LootTableTable {
  id: Generated<number>
  name: string
  created_at: Generated<Date>
}

export interface LootTableEntryTable {
  id: Generated<number>
  loot_table_id: number
  item_name: string
  drop_chance: number
  quantity_min: number
  quantity_max: number
  created_at: Generated<Date>
}

export type ItemCategory = "weapon" | "armor" | "accessory" | "consumable" | "material" | "crystal"
export type ItemRarity = "common" | "uncommon" | "rare" | "epic" | "legendary"
export type EquipmentSlotType = "inventory" | "main_hand" | "off_hand" | "head" | "chest" | "hands" | "legs" | "feet" | "accessory1" | "accessory2" | "accessory3"

export interface ItemDefinitionTable {
  id: Generated<number>
  name: string
  description: string | null
  category: ItemCategory
  subcategory: string | null
  rarity: ItemRarity
  stats: Generated<string>
  requirements: Generated<string>
  max_stack: number
  tradeable: boolean
  base_price: number
  created_at: Generated<Date>
}

export interface CharacterInventoryTable {
  id: Generated<number>
  character_id: number
  item_def_id: number
  quantity: number
  enhancement_level: number
  enhancement_stats: Generated<string>
  durability: number | null
  slot_type: EquipmentSlotType | null
  slot_index: number | null
  created_at: Generated<Date>
  updated_at: Generated<Date>
}

export interface Database {
  "sao.accounts": AccountTable
  "sao.characters": CharacterTable
  "sao.character_stats": CharacterStatsTable
  "sao.user": BetterAuthUserTable
  "sao.session": BetterAuthSessionTable
  "sao.account": BetterAuthAccountTable
  "sao.verification": BetterAuthVerificationTable
  "sao.jwks": JwksTable
  "sao.floor_definitions": FloorDefinitionTable
  "sao.zone_definitions": ZoneDefinitionTable
  "sao.skill_definitions": SkillDefinitionTable
  "sao.character_skills": CharacterSkillTable
  "sao.monster_definitions": MonsterDefinitionTable
  "sao.monster_spawns": MonsterSpawnTable
  "sao.loot_tables": LootTableTable
  "sao.loot_table_entries": LootTableEntryTable
  "sao.item_definitions": ItemDefinitionTable
  "sao.character_inventory": CharacterInventoryTable
}
