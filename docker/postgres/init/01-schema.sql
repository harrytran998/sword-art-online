-- Sword Art Online — Initial Database Schema
-- This runs automatically on first PostgreSQL container start

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create application schema
CREATE SCHEMA IF NOT EXISTS sao;

-- Set default search path
ALTER DATABASE sao SET search_path TO sao, public;

-- ============================================================
-- Accounts (managed by Better Auth, extended here)
-- ============================================================
CREATE TABLE IF NOT EXISTS sao.accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(32) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'banned', 'suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_accounts_email ON sao.accounts (email);
CREATE INDEX idx_accounts_username ON sao.accounts (username);
CREATE INDEX idx_accounts_status ON sao.accounts (status);

-- ============================================================
-- Characters
-- ============================================================
CREATE TABLE IF NOT EXISTS sao.characters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES sao.accounts(id) ON DELETE CASCADE,
    name VARCHAR(32) NOT NULL UNIQUE,
    level INTEGER NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 100),
    experience BIGINT NOT NULL DEFAULT 0 CHECK (experience >= 0),
    current_hp INTEGER NOT NULL DEFAULT 100 CHECK (current_hp >= 0),
    max_hp INTEGER NOT NULL DEFAULT 100 CHECK (max_hp > 0),
    current_floor INTEGER NOT NULL DEFAULT 1 CHECK (current_floor BETWEEN 1 AND 100),
    col BIGINT NOT NULL DEFAULT 0 CHECK (col >= 0),
    is_alive BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_characters_account ON sao.characters (account_id);
CREATE INDEX idx_characters_name ON sao.characters (name);
CREATE INDEX idx_characters_floor ON sao.characters (current_floor);

-- ============================================================
-- Character Stats
-- ============================================================
CREATE TABLE IF NOT EXISTS sao.character_stats (
    character_id UUID PRIMARY KEY REFERENCES sao.characters(id) ON DELETE CASCADE,
    str INTEGER NOT NULL DEFAULT 1 CHECK (str BETWEEN 1 AND 999),
    agi INTEGER NOT NULL DEFAULT 1 CHECK (agi BETWEEN 1 AND 999),
    vit INTEGER NOT NULL DEFAULT 1 CHECK (vit BETWEEN 1 AND 999),
    dex INTEGER NOT NULL DEFAULT 1 CHECK (dex BETWEEN 1 AND 999),
    int INTEGER NOT NULL DEFAULT 1 CHECK (int BETWEEN 1 AND 999),
    lck INTEGER NOT NULL DEFAULT 1 CHECK (lck BETWEEN 1 AND 999),
    unallocated_points INTEGER NOT NULL DEFAULT 0 CHECK (unallocated_points >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Updated-at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION sao.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_accounts_updated_at
    BEFORE UPDATE ON sao.accounts
    FOR EACH ROW EXECUTE FUNCTION sao.update_updated_at();

CREATE TRIGGER trg_characters_updated_at
    BEFORE UPDATE ON sao.characters
    FOR EACH ROW EXECUTE FUNCTION sao.update_updated_at();

CREATE TRIGGER trg_character_stats_updated_at
    BEFORE UPDATE ON sao.character_stats
    FOR EACH ROW EXECUTE FUNCTION sao.update_updated_at();
