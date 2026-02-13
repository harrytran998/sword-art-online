# Sword Art Online: Aincrad Online
## Database Design Document

**Version:** 1.0.0  
**Date:** February 2026  
**Status:** Planning Phase

---

## Table of Contents

1. [Database Overview](#1-database-overview)
2. [PostgreSQL Schema](#2-postgresql-schema)
3. [Redis Data Structures](#3-redis-data-structures)
4. [TimescaleDB Schema](#4-timescaledb-schema)
5. [Data Access Patterns](#5-data-access-patterns)
6. [Indexing Strategy](#6-indexing-strategy)
7. [Migration Strategy](#7-migration-strategy)
8. [Backup & Recovery](#8-backup--recovery)

---

## 1. Database Overview

### 1.1 Multi-Database Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│    ┌─────────────────────────────────────────────────────────────┐      │
│    │                    PostgreSQL (Primary)                      │      │
│    │  • Player accounts and characters                            │      │
│    │  • Inventory and equipment                                   │      │
│    │  • Quest progress and achievements                           │      │
│    │  • Guild data                                                │      │
│    │  • Economy transactions                                      │      │
│    │  • World configuration                                       │      │
│    └─────────────────────────────────────────────────────────────┘      │
│                                                                          │
│    ┌─────────────────────────────────────────────────────────────┐      │
│    │                    Redis (Cache/Hot Data)                    │      │
│    │  • Active player sessions                                    │      │
│    │  • Real-time positions                                       │      │
│    │  • Leaderboards                                              │      │
│    │  • Zone player lists                                         │      │
│    │  • Rate limiting counters                                    │      │
│    │  • Distributed locks                                         │      │
│    └─────────────────────────────────────────────────────────────┘      │
│                                                                          │
│    ┌─────────────────────────────────────────────────────────────┐      │
│    │                    TimescaleDB (Analytics)                   │      │
│    │  • Game events (time-series)                                 │      │
│    │  • Player sessions                                           │      │
│    │  • Combat logs                                               │      │
│    │  • Economy analytics                                         │      │
│    │  • Performance metrics                                       │      │
│    └─────────────────────────────────────────────────────────────┘      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Database Selection Rationale

| Database | Use Case | Why |
|----------|----------|-----|
| **PostgreSQL** | Primary data store | ACID compliance, complex queries, JSON support |
| **Redis** | Hot data cache | Sub-millisecond latency, pub/sub, sorted sets |
| **TimescaleDB** | Analytics | Time-series optimization, continuous aggregates |

---

## 2. PostgreSQL Schema

### 2.1 Accounts & Authentication

```sql
-- ============================================
-- ACCOUNTS
-- ============================================

CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(64) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'banned', 'suspended', 'deleted')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMPTZ,
    last_login_ip INET,
    
    -- Indexes
    CONSTRAINT accounts_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT accounts_username_check CHECK (username ~* '^[A-Za-z0-9_]{3,64}$')
);

CREATE INDEX idx_accounts_email ON accounts(email);
CREATE INDEX idx_accounts_username ON accounts(username);
CREATE INDEX idx_accounts_status ON accounts(status);

-- ============================================
-- ACCOUNT SESSIONS
-- ============================================

CREATE TABLE account_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    
    CONSTRAINT account_sessions_expires_check CHECK (expires_at > created_at)
);

CREATE INDEX idx_sessions_account ON account_sessions(account_id);
CREATE INDEX idx_sessions_token ON account_sessions(token_hash);
CREATE INDEX idx_sessions_expires ON account_sessions(expires_at) WHERE revoked_at IS NULL;

-- ============================================
-- ACCOUNT SETTINGS
-- ============================================

CREATE TABLE account_settings (
    account_id UUID PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    trade_requests_enabled BOOLEAN DEFAULT TRUE,
    friend_requests_enabled BOOLEAN DEFAULT TRUE,
    guild_invites_enabled BOOLEAN DEFAULT TRUE,
    ui_settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

### 2.2 Characters

```sql
-- ============================================
-- CHARACTERS
-- ============================================

CREATE TABLE characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    name VARCHAR(64) UNIQUE NOT NULL,
    
    -- Appearance (limited post-creation)
    face_type INT DEFAULT 1,
    hair_style INT DEFAULT 1,
    hair_color INT DEFAULT 1,
    eye_color INT DEFAULT 1,
    skin_tone INT DEFAULT 1,
    
    -- Class and Level
    class_id INT NOT NULL REFERENCES class_definitions(id),
    level INT DEFAULT 1,
    experience BIGINT DEFAULT 0,
    
    -- Position
    floor_id INT NOT NULL DEFAULT 1,
    zone_id VARCHAR(64) NOT NULL DEFAULT 'floor_1_town',
    x FLOAT NOT NULL DEFAULT 0,
    y FLOAT NOT NULL DEFAULT 0,
    z FLOAT NOT NULL DEFAULT 0,
    rotation FLOAT DEFAULT 0,
    
    -- Vital Stats
    hp INT NOT NULL,
    max_hp INT NOT NULL,
    mp INT NOT NULL,
    max_mp INT NOT NULL,
    
    -- Currency
    col BIGINT DEFAULT 1000 CHECK (col >= 0),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_played_at TIMESTAMPTZ,
    total_playtime_seconds BIGINT DEFAULT 0,
    
    -- Constraints
    CONSTRAINT characters_name_check CHECK (name ~* '^[A-Za-z0-9_]{2,64}$'),
    CONSTRAINT characters_level_check CHECK (level >= 1 AND level <= 100),
    CONSTRAINT characters_hp_check CHECK (hp >= 0 AND hp <= max_hp),
    CONSTRAINT characters_mp_check CHECK (mp >= 0 AND mp <= max_mp)
);

CREATE INDEX idx_characters_account ON characters(account_id);
CREATE INDEX idx_characters_name ON characters(name);
CREATE INDEX idx_characters_floor_zone ON characters(floor_id, zone_id);
CREATE INDEX idx_characters_level ON characters(level DESC);

-- ============================================
-- CHARACTER STATS
-- ============================================

CREATE TABLE character_stats (
    character_id UUID PRIMARY KEY REFERENCES characters(id) ON DELETE CASCADE,
    
    -- Base Stats
    strength INT DEFAULT 10 CHECK (strength >= 1),
    agility INT DEFAULT 10 CHECK (agility >= 1),
    vitality INT DEFAULT 10 CHECK (vitality >= 1),
    dexterity INT DEFAULT 10 CHECK (dexterity >= 1),
    intelligence INT DEFAULT 10 CHECK (intelligence >= 1),
    luck INT DEFAULT 10 CHECK (luck >= 1),
    
    -- Stat Points Available
    unallocated_points INT DEFAULT 0 CHECK (unallocated_points >= 0),
    
    -- Computed Stats (cached)
    physical_attack INT DEFAULT 10,
    physical_defense INT DEFAULT 10,
    magic_attack INT DEFAULT 10,
    magic_defense INT DEFAULT 10,
    attack_speed FLOAT DEFAULT 1.0,
    critical_rate FLOAT DEFAULT 5.0,
    critical_damage FLOAT DEFAULT 150.0,
    evasion_rate FLOAT DEFAULT 5.0,
    accuracy_rate FLOAT DEFAULT 95.0,
    move_speed FLOAT DEFAULT 5.0,
    
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- CHARACTER SKILLS
-- ============================================

CREATE TABLE character_skills (
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    skill_id INT NOT NULL REFERENCES skill_definitions(id),
    
    -- Proficiency
    level INT DEFAULT 1 CHECK (level >= 1),
    proficiency INT DEFAULT 0 CHECK (proficiency >= 0),
    
    -- Slot assignment
    slot_index INT CHECK (slot_index >= 0 AND slot_index < 10),
    
    -- Timestamps
    unlocked_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMPTZ,
    
    PRIMARY KEY (character_id, skill_id)
);

CREATE INDEX idx_character_skills_slot ON character_skills(character_id, slot_index) WHERE slot_index IS NOT NULL;
```

### 2.3 Inventory & Equipment

```sql
-- ============================================
-- ITEM DEFINITIONS
-- ============================================

CREATE TABLE item_definitions (
    id INT PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    
    -- Classification
    category VARCHAR(32) NOT NULL, -- weapon, armor, consumable, material, quest
    subcategory VARCHAR(32),
    
    -- Rarity
    rarity VARCHAR(20) NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary', 'unique')),
    
    -- Stats (for equipment)
    stats JSONB DEFAULT '{}',
    -- Example: {"strength": 10, "agility": 5, "critical_rate": 2.5}
    
    -- Requirements
    requirements JSONB DEFAULT '{}',
    -- Example: {"level": 10, "class": ["swordsman", "fencer"], "strength": 20}
    
    -- Item properties
    max_stack INT DEFAULT 1 CHECK (max_stack >= 1),
    tradeable BOOLEAN DEFAULT TRUE,
    destructible BOOLEAN DEFAULT TRUE,
    
    -- Visual
    icon_id VARCHAR(64),
    model_id VARCHAR(64),
    
    -- Value
    base_price INT DEFAULT 0 CHECK (base_price >= 0),
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_item_definitions_category ON item_definitions(category, subcategory);
CREATE INDEX idx_item_definitions_rarity ON item_definitions(rarity);

-- ============================================
-- CHARACTER INVENTORY
-- ============================================

CREATE TABLE character_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    
    -- Item reference
    item_definition_id INT NOT NULL REFERENCES item_definitions(id),
    
    -- Stack info
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity >= 1),
    
    -- Instance-specific data
    enhancement_level INT DEFAULT 0 CHECK (enhancement_level >= 0 AND enhancement_level <= 20),
    enhancement_stats JSONB DEFAULT '{}',
    -- Example: {"sharpness": 6, "accuracy": 3, "durability": 3}
    
    -- Durability
    current_durability INT,
    max_durability INT,
    
    -- Custom data (enchants, etc.)
    custom_data JSONB DEFAULT '{}',
    
    -- Location
    slot_type VARCHAR(20) NOT NULL DEFAULT 'inventory' CHECK (slot_type IN ('inventory', 'equipment', 'bank', 'trade')),
    slot_index INT NOT NULL CHECK (slot_index >= 0),
    
    -- Metadata
    acquired_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    acquired_from VARCHAR(64),
    
    -- Constraints
    CONSTRAINT inventory_durability_check CHECK (
        current_durability IS NULL OR 
        (current_durability >= 0 AND current_durability <= max_durability)
    )
);

CREATE INDEX idx_inventory_character ON character_inventory(character_id);
CREATE INDEX idx_inventory_slot ON character_inventory(character_id, slot_type, slot_index);
CREATE INDEX idx_inventory_item ON character_inventory(item_definition_id);

-- Unique constraint for slot assignment
CREATE UNIQUE INDEX idx_inventory_unique_slot ON character_inventory(character_id, slot_type, slot_index);

-- ============================================
-- EQUIPMENT SLOTS
-- ============================================

-- Equipment slots stored in inventory with slot_type = 'equipment'
-- Slot indices:
-- 0 = Main Hand
-- 1 = Off Hand / Shield
-- 2 = Head
-- 3 = Chest
-- 4 = Hands
-- 5 = Legs
-- 6 = Feet
-- 7 = Accessory 1
-- 8 = Accessory 2
-- 9 = Accessory 3

-- View for equipped items
CREATE VIEW character_equipment AS
SELECT 
    ci.*,
    c.id as character_id,
    c.name as character_name
FROM character_inventory ci
JOIN characters c ON ci.character_id = c.id
WHERE ci.slot_type = 'equipment';
```

### 2.4 World & Floors

```sql
-- ============================================
-- FLOOR DEFINITIONS
-- ============================================

CREATE TABLE floor_definitions (
    id INT PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    
    -- Theme
    theme VARCHAR(64) NOT NULL,
    environment_type VARCHAR(32) NOT NULL,
    
    -- Level range
    recommended_min_level INT NOT NULL,
    recommended_max_level INT NOT NULL,
    
    -- Dimensions
    diameter_meters FLOAT NOT NULL,
    
    -- Progress
    boss_defeated BOOLEAN DEFAULT FALSE,
    boss_defeated_at TIMESTAMPTZ,
    boss_defeated_by UUID REFERENCES guilds(id),
    
    -- Unlock
    unlocked BOOLEAN DEFAULT FALSE,
    unlocked_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ZONE DEFINITIONS
-- ============================================

CREATE TABLE zone_definitions (
    id VARCHAR(64) PRIMARY KEY,
    floor_id INT NOT NULL REFERENCES floor_definitions(id),
    name VARCHAR(128) NOT NULL,
    zone_type VARCHAR(32) NOT NULL CHECK (zone_type IN ('town', 'field', 'dungeon', 'labyrinth', 'boss_room')),
    
    -- Bounds
    min_x FLOAT NOT NULL,
    max_x FLOAT NOT NULL,
    min_y FLOAT NOT NULL,
    max_y FLOAT NOT NULL,
    min_z FLOAT NOT NULL,
    max_z FLOAT NOT NULL,
    
    -- Spawn points
    default_spawn_x FLOAT NOT NULL,
    default_spawn_y FLOAT NOT NULL,
    default_spawn_z FLOAT NOT NULL,
    
    -- Properties
    pvp_enabled BOOLEAN DEFAULT FALSE,
    safe_zone BOOLEAN DEFAULT FALSE,
    
    -- Capacity
    max_players INT DEFAULT 500,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_zones_floor ON zone_definitions(floor_id);

-- ============================================
-- NPC DEFINITIONS
-- ============================================

CREATE TABLE npc_definitions (
    id INT PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    npc_type VARCHAR(32) NOT NULL CHECK (npc_type IN ('merchant', 'quest_giver', 'trainer', 'blacksmith', 'innkeeper', 'guard')),
    
    -- Stats (for combat NPCs)
    level INT,
    hp INT,
    attack INT,
    defense INT,
    
    -- Behavior
    dialogue_id INT,
    shop_id INT,
    
    -- Visual
    model_id VARCHAR(64),
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- MONSTER DEFINITIONS
-- ============================================

CREATE TABLE monster_definitions (
    id INT PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    monster_type VARCHAR(32) NOT NULL CHECK (monster_type IN ('normal', 'elite', 'field_boss', 'mid_boss', 'floor_boss')),
    
    -- Stats
    level INT NOT NULL,
    hp INT NOT NULL,
    mp INT DEFAULT 0,
    attack INT NOT NULL,
    defense INT NOT NULL,
    magic_attack INT DEFAULT 0,
    magic_defense INT DEFAULT 0,
    
    -- Rewards
    experience_reward INT NOT NULL,
    col_reward_min INT NOT NULL,
    col_reward_max INT NOT NULL,
    
    -- Loot table
    loot_table_id INT,
    
    -- AI
    aggro_range FLOAT DEFAULT 30,
    patrol_range FLOAT DEFAULT 50,
    
    -- Respawn
    respawn_time_seconds INT DEFAULT 60,
    
    -- Visual
    model_id VARCHAR(64) NOT NULL,
    scale FLOAT DEFAULT 1.0,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_monsters_type ON monster_definitions(monster_type);
CREATE INDEX idx_monsters_level ON monster_definitions(level);

-- ============================================
-- MONSTER SPAWNS
-- ============================================

CREATE TABLE monster_spawns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    monster_definition_id INT NOT NULL REFERENCES monster_definitions(id),
    zone_id VARCHAR(64) NOT NULL REFERENCES zone_definitions(id),
    
    -- Spawn location
    spawn_x FLOAT NOT NULL,
    spawn_y FLOAT NOT NULL,
    spawn_z FLOAT NOT NULL,
    spawn_rotation FLOAT DEFAULT 0,
    
    -- Spawn behavior
    spawn_count INT DEFAULT 1,
    spawn_radius FLOAT DEFAULT 10,
    
    -- Active instance (for respawn tracking)
    current_instance_id UUID,
    last_killed_at TIMESTAMPTZ,
    next_spawn_at TIMESTAMPTZ,
    
    enabled BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_monster_spawns_zone ON monster_spawns(zone_id);
CREATE INDEX idx_monster_spawns_next_spawn ON monster_spawns(next_spawn_at) WHERE enabled = TRUE;

-- ============================================
-- FLOOR BOSSES
-- ============================================

CREATE TABLE floor_bosses (
    floor_id INT PRIMARY KEY REFERENCES floor_definitions(id),
    monster_definition_id INT NOT NULL REFERENCES monster_definitions(id),
    
    -- Boss room
    boss_room_zone_id VARCHAR(64) NOT NULL REFERENCES zone_definitions(id),
    
    -- HP Bars (multi-phase)
    hp_bar_count INT DEFAULT 1 CHECK (hp_bar_count >= 1 AND hp_bar_count <= 10),
    
    -- Special mechanics
    anti_crystal_zone BOOLEAN DEFAULT FALSE,
    room_seals BOOLEAN DEFAULT FALSE,
    
    -- Rewards
    last_attack_bonus_item_id INT REFERENCES item_definitions(id),
    participation_reward_item_id INT REFERENCES item_definitions(id),
    
    -- Raid info
    max_raid_participants INT DEFAULT 48,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

### 2.5 Social & Guilds

```sql
-- ============================================
-- FRIENDSHIPS
-- ============================================

CREATE TABLE friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    accepter_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    -- Prevent self-friendship and duplicates
    CONSTRAINT friendships_different CHECK (requester_id != accepter_id),
    CONSTRAINT friendships_unique UNIQUE (requester_id, accepter_id)
);

CREATE INDEX idx_friendships_requester ON friendships(requester_id);
CREATE INDEX idx_friendships_accepter ON friendships(accepter_id);
CREATE INDEX idx_friendships_status ON friendships(status);

-- ============================================
-- GUILDS
-- ============================================

CREATE TABLE guilds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(64) UNIQUE NOT NULL,
    tag VARCHAR(6) UNIQUE NOT NULL,
    
    -- Leader
    leader_id UUID NOT NULL REFERENCES characters(id),
    
    -- Level & Experience
    level INT DEFAULT 1 CHECK (level >= 1 AND level <= 50),
    experience BIGINT DEFAULT 0,
    
    -- Treasury
    bank_col BIGINT DEFAULT 0 CHECK (bank_col >= 0),
    
    -- Capacity
    max_members INT DEFAULT 50,
    
    -- Description
    description TEXT,
    announcement TEXT,
    
    -- Recruitment
    recruitment_open BOOLEAN DEFAULT FALSE,
    min_level_requirement INT DEFAULT 1,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT guilds_name_check CHECK (name ~* '^[A-Za-z0-9 ]{3,64}$'),
    CONSTRAINT guilds_tag_check CHECK (tag ~* '^[A-Za-z0-9]{2,6}$')
);

CREATE INDEX idx_guilds_leader ON guilds(leader_id);
CREATE INDEX idx_guilds_name ON guilds(name);

-- ============================================
-- GUILD MEMBERS
-- ============================================

CREATE TABLE guild_members (
    guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    
    rank VARCHAR(32) DEFAULT 'member' CHECK (rank IN ('leader', 'officer', 'veteran', 'member', 'recruit')),
    
    contribution_points INT DEFAULT 0,
    
    joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_contribution_at TIMESTAMPTZ,
    
    PRIMARY KEY (guild_id, character_id)
);

CREATE INDEX idx_guild_members_character ON guild_members(character_id);
CREATE INDEX idx_guild_members_rank ON guild_members(rank);

-- ============================================
-- GUILD BANK
-- ============================================

CREATE TABLE guild_bank (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    
    -- Item reference
    item_definition_id INT NOT NULL REFERENCES item_definitions(id),
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity >= 1),
    enhancement_level INT DEFAULT 0,
    enhancement_stats JSONB DEFAULT '{}',
    
    -- Location
    slot_index INT NOT NULL CHECK (slot_index >= 0 AND slot_index < 500),
    
    -- Metadata
    deposited_by UUID NOT NULL REFERENCES characters(id),
    deposited_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT guild_bank_unique_slot UNIQUE (guild_id, slot_index)
);

CREATE INDEX idx_guild_bank_guild ON guild_bank(guild_id);

-- ============================================
-- CHAT MESSAGES
-- ============================================

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Channel
    channel_type VARCHAR(32) NOT NULL CHECK (channel_type IN ('world', 'floor', 'zone', 'guild', 'party', 'whisper', 'trade')),
    channel_id VARCHAR(64), -- guild_id, party_id, zone_id, or NULL for world
    
    -- Participants
    sender_id UUID REFERENCES characters(id) ON DELETE SET NULL,
    recipient_id UUID REFERENCES characters(id) ON DELETE SET NULL, -- For whispers
    
    -- Content
    content TEXT NOT NULL CHECK (char_length(content) <= 500),
    
    -- Moderation
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES accounts(id),
    deletion_reason VARCHAR(255),
    
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    -- Partitioning key
    shard_key INT NOT NULL DEFAULT (floor(random() * 16))
);

-- Partition by shard key for performance
CREATE INDEX idx_chat_created ON chat_messages(created_at DESC);
CREATE INDEX idx_chat_sender ON chat_messages(sender_id, created_at DESC);
CREATE INDEX idx_chat_channel ON chat_messages(channel_type, channel_id, created_at DESC);
```

### 2.6 Economy & Trading

```sql
-- ============================================
-- TRADES
-- ============================================

CREATE TABLE trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Participants
    player_a_id UUID NOT NULL REFERENCES characters(id),
    player_b_id UUID NOT NULL REFERENCES characters(id),
    
    -- Items offered
    player_a_items JSONB DEFAULT '[]', -- Array of {item_id, quantity}
    player_b_items JSONB DEFAULT '[]',
    
    -- Col offered
    player_a_col BIGINT DEFAULT 0,
    player_b_col BIGINT DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'failed')),
    
    -- Confirmation
    player_a_confirmed BOOLEAN DEFAULT FALSE,
    player_b_confirmed BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    
    CONSTRAINT trades_different CHECK (player_a_id != player_b_id)
);

CREATE INDEX idx_trades_player ON trades(player_a_id, status);
CREATE INDEX idx_trades_player ON trades(player_b_id, status);

-- ============================================
-- AUCTION HOUSE
-- ============================================

CREATE TABLE auction_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Seller
    seller_id UUID NOT NULL REFERENCES characters(id),
    
    -- Item
    item_id UUID NOT NULL REFERENCES character_inventory(id),
    item_definition_id INT NOT NULL REFERENCES item_definitions(id),
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity >= 1),
    enhancement_level INT DEFAULT 0,
    enhancement_stats JSONB DEFAULT '{}',
    
    -- Pricing
    starting_bid BIGINT NOT NULL CHECK (starting_bid >= 0),
    buyout_price BIGINT CHECK (buyout_price >= starting_bid),
    current_bid BIGINT,
    current_bidder_id UUID REFERENCES characters(id),
    
    -- Duration
    duration_hours INT NOT NULL DEFAULT 24 CHECK (duration_hours >= 1 AND duration_hours <= 168),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    ends_at TIMESTAMPTZ NOT NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'sold', 'expired', 'cancelled')),
    
    CONSTRAINT auction_listings_buyout_check CHECK (buyout_price IS NULL OR buyout_price > starting_bid)
);

CREATE INDEX idx_auction_seller ON auction_listings(seller_id, status);
CREATE INDEX idx_auction_item ON auction_listings(item_definition_id, status);
CREATE INDEX idx_auction_ends ON auction_listings(ends_at) WHERE status = 'active';

-- ============================================
-- TRANSACTIONS LOG (Audit Trail)
-- ============================================

CREATE TABLE economy_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Type
    transaction_type VARCHAR(32) NOT NULL CHECK (transaction_type IN (
        'trade', 'auction_buy', 'auction_sell', 'npc_buy', 'npc_sell',
        'loot', 'quest_reward', 'mail', 'guild_bank', 'enhancement'
    )),
    
    -- Participants
    source_id UUID, -- Player ID or NULL for system
    target_id UUID, -- Player ID or NPC ID
    
    -- Items
    items JSONB DEFAULT '[]',
    
    -- Currency
    col_amount BIGINT DEFAULT 0,
    
    -- Reference
    reference_id UUID, -- trade_id, auction_id, etc.
    reference_type VARCHAR(32),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_source ON economy_transactions(source_id, created_at DESC);
CREATE INDEX idx_transactions_target ON economy_transactions(target_id, created_at DESC);
CREATE INDEX idx_transactions_type ON economy_transactions(transaction_type, created_at DESC);
```

### 2.7 Quests & Achievements

```sql
-- ============================================
-- QUEST DEFINITIONS
-- ============================================

CREATE TABLE quest_definitions (
    id INT PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    description TEXT NOT NULL,
    
    -- Classification
    quest_type VARCHAR(32) NOT NULL CHECK (quest_type IN ('main', 'side', 'daily', 'weekly', 'chain')),
    category VARCHAR(64),
    
    -- Requirements
    required_level INT DEFAULT 1,
    required_floor INT DEFAULT 1,
    prerequisite_quest_id INT REFERENCES quest_definitions(id),
    
    -- Objectives
    objectives JSONB NOT NULL DEFAULT '[]',
    -- Example: [{"type": "kill", "target": "goblin", "count": 10}, {"type": "collect", "item_id": 100, "count": 5}]
    
    -- Rewards
    experience_reward INT DEFAULT 0,
    col_reward INT DEFAULT 0,
    item_rewards JSONB DEFAULT '[]',
    -- Example: [{"item_id": 100, "quantity": 1, "chance": 100}]
    
    -- Repeatable
    repeatable BOOLEAN DEFAULT FALSE,
    repeat_cooldown_hours INT DEFAULT 24,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- CHARACTER QUESTS
-- ============================================

CREATE TABLE character_quests (
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    quest_id INT NOT NULL REFERENCES quest_definitions(id),
    
    -- Progress
    status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('not_started', 'in_progress', 'completed', 'turned_in')),
    objective_progress JSONB DEFAULT '{}',
    -- Example: {"kills": {"goblin": 5}, "collected": {"100": 3}}
    
    -- Timestamps
    started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    turned_in_at TIMESTAMPTZ,
    
    -- Repeat tracking
    last_completed_at TIMESTAMPTZ,
    
    PRIMARY KEY (character_id, quest_id)
);

CREATE INDEX idx_character_quests_status ON character_quests(character_id, status);

-- ============================================
-- ACHIEVEMENT DEFINITIONS
-- ============================================

CREATE TABLE achievement_definitions (
    id INT PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    description TEXT NOT NULL,
    
    -- Category
    category VARCHAR(32) NOT NULL CHECK (category IN ('combat', 'exploration', 'social', 'economy', 'special')),
    
    -- Requirements
    requirements JSONB NOT NULL,
    -- Example: {"type": "kill_count", "target": 1000}
    
    -- Rewards
    title_reward VARCHAR(64),
    item_rewards JSONB DEFAULT '[]',
    
    -- Display
    icon_id VARCHAR(64),
    points INT DEFAULT 10,
    
    -- Visibility
    hidden BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- CHARACTER ACHIEVEMENTS
-- ============================================

CREATE TABLE character_achievements (
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    achievement_id INT NOT NULL REFERENCES achievement_definitions(id),
    
    -- Progress
    progress INT DEFAULT 0,
    progress_max INT NOT NULL,
    
    -- Completion
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    
    PRIMARY KEY (character_id, achievement_id)
);

CREATE INDEX idx_achievements_completed ON character_achievements(character_id, completed);
```

---

## 3. Redis Data Structures

### 3.1 Session & Authentication

```
# Session data (TTL: 1 hour)
session:{session_id}
  → JSON: {
      "account_id": "uuid",
      "character_id": "uuid",
      "token": "jwt_hash",
      "ip": "192.168.1.1",
      "connected_at": 1700000000,
      "last_activity": 1700000000
    }
  TTL: 3600

# Token to session mapping
token:{token_hash}
  → session_id
  TTL: 3600
```

### 3.2 Real-Time Game State

```
# Player position (TTL: 5 minutes, refreshed on update)
player:position:{character_id}
  → JSON: {
      "x": 100.5,
      "y": 50.0,
      "z": 200.3,
      "floor_id": 1,
      "zone_id": "floor_1_town",
      "rotation": 90,
      "velocity_x": 0,
      "velocity_y": 0,
      "velocity_z": 0,
      "updated_at": 1700000000
    }
  TTL: 300

# Zone players (Set)
zone:players:{zone_id}
  → SET: ["char_id_1", "char_id_2", ...]
  (No TTL, managed by game loop)

# Online players (Set)
players:online
  → SET: ["char_id_1", "char_id_2", ...]
  (No TTL, managed by connection handler)
```

### 3.3 Leaderboards

```
# Global leaderboard (Sorted Set)
leaderboard:global
  → ZSET: {
      "char_id_1": 15000,
      "char_id_2": 14200,
      "char_id_3": 16500
    }

# Weekly leaderboard (Sorted Set, auto-expire)
leaderboard:weekly:{year}-W{week}
  → ZSET: {...}
  TTL: 604800 (7 days)

# Floor clear leaderboard (Sorted Set)
leaderboard:floor_clear:{floor_id}
  → ZSET: {...}
  (No TTL)

# PvP leaderboard (Sorted Set)
leaderboard:pvp
  → ZSET: {...}
```

### 3.4 Rate Limiting

```
# Rate limit counter (Token bucket)
ratelimit:message:{character_id}
  → Token bucket state
  TTL: 60

# Rate limit counter (Sliding window)
ratelimit:connection:{ip}
  → List of timestamps
  TTL: 3600
```

### 3.5 Distributed Locks

```
# Trade lock (prevents concurrent trades)
lock:trade:{character_id}
  → "locked"
  TTL: 30

# Inventory operation lock
lock:inventory:{character_id}
  → "locked"
  TTL: 10
```

---

## 4. TimescaleDB Schema

### 4.1 Game Events

```sql
-- ============================================
-- GAME EVENTS (Time-Series)
-- ============================================

CREATE TABLE game_events (
    time TIMESTAMPTZ NOT NULL,
    event_id UUID DEFAULT gen_random_uuid(),
    
    -- Event classification
    event_type VARCHAR(64) NOT NULL,
    event_category VARCHAR(32) NOT NULL CHECK (event_category IN (
        'combat', 'movement', 'economy', 'social', 'quest', 'system'
    )),
    
    -- Entity references
    character_id UUID,
    target_id UUID,
    zone_id VARCHAR(64),
    floor_id INT,
    
    -- Event data
    event_data JSONB NOT NULL DEFAULT '{}',
    
    -- Server info
    server_id VARCHAR(64),
    
    -- Partitioning
    shard_key INT NOT NULL DEFAULT (floor(random() * 16))
);

-- Convert to hypertable
SELECT create_hypertable('game_events', 'time', chunk_time_interval => INTERVAL '1 hour');

-- Indexes
CREATE INDEX idx_events_time ON game_events(time DESC);
CREATE INDEX idx_events_character ON game_events(character_id, time DESC);
CREATE INDEX idx_events_type ON game_events(event_type, time DESC);
CREATE INDEX idx_events_category ON game_events(event_category, time DESC);

-- ============================================
-- PLAYER SESSIONS (Time-Series)
-- ============================================

CREATE TABLE player_sessions (
    time TIMESTAMPTZ NOT NULL,
    session_id UUID PRIMARY KEY,
    
    -- Player
    character_id UUID NOT NULL,
    account_id UUID NOT NULL,
    
    -- Session info
    ip_address INET,
    server_id VARCHAR(64),
    zone_id VARCHAR(64),
    
    -- Duration
    duration_seconds INT,
    
    -- Activity
    actions_count INT DEFAULT 0,
    combat_encounters INT DEFAULT 0,
    
    -- Progress
    xp_gained BIGINT DEFAULT 0,
    col_gained BIGINT DEFAULT 0,
    items_gained INT DEFAULT 0,
    
    -- Status
    ended_at TIMESTAMPTZ,
    end_reason VARCHAR(32)
);

SELECT create_hypertable('player_sessions', 'time', chunk_time_interval => INTERVAL '1 day');

-- Continuous aggregate for daily active users
CREATE MATERIALIZED VIEW daily_active_users
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 day', time) AS day,
    COUNT(DISTINCT character_id) AS dau,
    COUNT(DISTINCT account_id) AS unique_accounts
FROM player_sessions
GROUP BY day;

-- Refresh policy
SELECT add_continuous_aggregate_policy('daily_active_users',
    start_offset => INTERVAL '1 day',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour');
```

### 4.2 Combat Analytics

```sql
-- ============================================
-- COMBAT LOGS
-- ============================================

CREATE TABLE combat_logs (
    time TIMESTAMPTZ NOT NULL,
    combat_id UUID NOT NULL,
    
    -- Participants
    attacker_id UUID,
    attacker_type VARCHAR(32) CHECK (attacker_type IN ('player', 'monster', 'npc')),
    defender_id UUID,
    defender_type VARCHAR(32),
    
    -- Action
    action_type VARCHAR(32) NOT NULL CHECK (action_type IN (
        'skill_use', 'auto_attack', 'damage', 'heal', 'buff', 'debuff', 'death'
    )),
    skill_id INT,
    
    -- Values
    damage INT,
    heal INT,
    is_critical BOOLEAN DEFAULT FALSE,
    
    -- Context
    zone_id VARCHAR(64),
    floor_id INT,
    
    -- Session
    session_id UUID
);

SELECT create_hypertable('combat_logs', 'time', chunk_time_interval => INTERVAL '6 hours');

-- Continuous aggregate for damage per second analytics
CREATE MATERIALIZED VIEW hourly_damage_stats
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 hour', time) AS hour,
    attacker_id,
    SUM(damage) AS total_damage,
    COUNT(*) AS hit_count,
    AVG(damage) AS avg_damage
FROM combat_logs
WHERE action_type = 'damage' AND attacker_type = 'player'
GROUP BY hour, attacker_id;
```

---

## 5. Data Access Patterns

### 5.1 Common Queries

```sql
-- Get player with full data (for login)
SELECT 
    c.*,
    cs.*,
    json_agg(DISTINCT jsonb_build_object(
        'skill_id', csk.skill_id,
        'level', csk.level,
        'slot_index', csk.slot_index
    )) FILTER (WHERE csk.skill_id IS NOT NULL) as skills
FROM characters c
LEFT JOIN character_stats cs ON c.id = cs.character_id
LEFT JOIN character_skills csk ON c.id = csk.character_id
WHERE c.id = $1
GROUP BY c.id, cs.character_id;

-- Get player inventory
SELECT 
    ci.*,
    id.name,
    id.rarity,
    id.category
FROM character_inventory ci
JOIN item_definitions id ON ci.item_definition_id = id.id
WHERE ci.character_id = $1 AND ci.slot_type = 'inventory'
ORDER BY ci.slot_index;

-- Get zone monsters
SELECT 
    ms.id as spawn_id,
    ms.spawn_x, ms.spawn_y, ms.spawn_z,
    md.*
FROM monster_spawns ms
JOIN monster_definitions md ON ms.monster_definition_id = md.id
WHERE ms.zone_id = $1 AND ms.enabled = TRUE;

-- Get friends online
SELECT 
    c.id, c.name, c.level, c.floor_id, c.zone_id
FROM friendships f
JOIN characters c ON (
    (f.requester_id = $1 AND c.id = f.accepter_id) OR
    (f.accepter_id = $1 AND c.id = f.requester_id)
)
WHERE f.status = 'accepted'
AND c.id IN (SELECT * FROM players_online);
```

### 5.2 Effect-TS Database Service

```typescript
// services/database.ts
import { Context, Effect, Layer } from "effect"
import { Pool } from "pg"

class DatabaseService extends Context.Tag("DatabaseService")<
  DatabaseService,
  {
    readonly query: <T>(sql: string, params: unknown[]) => Effect.Effect<T[], DatabaseError>
    readonly execute: (sql: string, params: unknown[]) => Effect.Effect<number, DatabaseError>
    readonly transaction: <A>(effect: Effect.Effect<A, DatabaseError>) => Effect.Effect<A, DatabaseError>
  }
>() {}

const DatabaseLive = Layer.effect(
  DatabaseService,
  Effect.gen(function* () {
    const config = yield* Config.database
    
    const pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.name,
      user: config.user,
      password: config.password,
      max: config.poolSize
    })
    
    return {
      query: <T>(sql: string, params: unknown[]) =>
        Effect.tryPromise({
          try: () => pool.query<T>(sql, params).then((result) => result.rows),
          catch: (cause) => new DatabaseError({ query: sql, cause })
        }),
        
      execute: (sql: string, params: unknown[]) =>
        Effect.tryPromise({
          try: () => pool.query(sql, params).then((result) => result.rowCount ?? 0),
          catch: (cause) => new DatabaseError({ query: sql, cause })
        }),
        
      transaction: <A>(effect: Effect.Effect<A, DatabaseError>) =>
        Effect.gen(function* () {
          const client = yield* Effect.tryPromise({
            try: () => pool.connect(),
            catch: (cause) => new DatabaseError({ query: "CONNECT", cause })
          })
          
          try {
            yield* Effect.tryPromise({
              try: () => client.query("BEGIN"),
              catch: (cause) => new DatabaseError({ query: "BEGIN", cause })
            })
            
            const result = yield* effect
            
            yield* Effect.tryPromise({
              try: () => client.query("COMMIT"),
              catch: (cause) => new DatabaseError({ query: "COMMIT", cause })
            })
            
            return result
          } catch (error) {
            yield* Effect.tryPromise({
              try: () => client.query("ROLLBACK"),
              catch: () => {} // Ignore rollback errors
            })
            return yield* Effect.fail(error)
          } finally {
            client.release()
          }
        })
    }
  })
)
```

---

## 6. Indexing Strategy

### 6.1 Index Categories

| Category | Index Type | Purpose |
|----------|------------|---------|
| **Primary Key** | B-Tree | Unique identifier lookup |
| **Foreign Key** | B-Tree | JOIN optimization |
| **Lookup** | B-Tree | Point queries (WHERE x = y) |
| **Range** | B-Tree | Range queries (WHERE x > y) |
| **Full Text** | GIN | Text search |
| **JSON** | GIN | JSON field queries |

### 6.2 Critical Indexes

```sql
-- Most frequently accessed
CREATE INDEX CONCURRENTLY idx_characters_online ON characters(floor_id, zone_id) WHERE status = 'active';

-- Inventory lookups
CREATE INDEX CONCURRENTLY idx_inventory_equipment ON character_inventory(character_id) WHERE slot_type = 'equipment';

-- Zone queries
CREATE INDEX CONCURRENTLY idx_zone_active_monsters ON monster_spawns(zone_id) WHERE enabled = TRUE;

-- Leaderboard queries
CREATE INDEX CONCURRENTLY idx_characters_level_leaderboard ON characters(level DESC, experience DESC);

-- Time-series queries (TimescaleDB handles automatically)
-- No additional indexes needed for hypertables
```

---

## 7. Migration Strategy

### 7.1 Drizzle ORM Configuration

```typescript
// drizzle.config.ts
import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT || "5432"),
    database: process.env.DB_NAME!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!
  },
  verbose: true,
  strict: true
})
```

### 7.2 Migration Workflow

```
1. Development:
   - Modify schema in src/db/schema.ts
   - Run: bunx drizzle-kit generate
   - Review generated migration
   - Run: bunx drizzle-kit push (dev)

2. Production:
   - Migrations stored in drizzle/migrations/
   - Deploy with zero-downtime strategy
   - Apply migrations before code deployment
   - Rollback plan for each migration
```

---

## 8. Backup & Recovery

### 8.1 Backup Strategy

| Type | Frequency | Retention | Storage |
|------|-----------|-----------|---------|
| **Full Backup** | Daily | 30 days | S3 |
| **Incremental** | Hourly | 7 days | S3 |
| **WAL Archive** | Continuous | 7 days | S3 |
| **Redis Snapshot** | Every 6 hours | 7 days | S3 |

### 8.2 Recovery Procedures

```bash
# PostgreSQL Point-in-Time Recovery
# 1. Stop PostgreSQL
# 2. Restore base backup
# 3. Replay WAL files to target time
# 4. Start PostgreSQL

# Redis Recovery
# 1. Stop Redis
# 2. Replace dump.rdb with backup
# 3. Start Redis
```

---

**Document Version:** 1.0.0  
**Last Updated:** February 2026  
**Owner:** Database Team
