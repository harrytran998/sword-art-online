-- Create characters and character_stats tables
CREATE TABLE sao.characters (
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

CREATE TABLE sao.character_stats (
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

CREATE TRIGGER trg_characters_updated_at
    BEFORE UPDATE ON sao.characters
    FOR EACH ROW EXECUTE FUNCTION sao.update_updated_at();

CREATE TRIGGER trg_character_stats_updated_at
    BEFORE UPDATE ON sao.character_stats
    FOR EACH ROW EXECUTE FUNCTION sao.update_updated_at();
