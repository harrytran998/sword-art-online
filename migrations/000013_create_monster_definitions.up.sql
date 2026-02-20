CREATE TABLE sao.monster_definitions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    monster_type VARCHAR(32) NOT NULL CHECK (monster_type IN ('beast', 'humanoid', 'undead', 'elemental', 'demon', 'boss')),
    level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 100),
    hp INTEGER NOT NULL CHECK (hp > 0),
    attack INTEGER NOT NULL CHECK (attack >= 0),
    defense INTEGER NOT NULL CHECK (defense >= 0),
    exp_reward INTEGER NOT NULL CHECK (exp_reward >= 0),
    col_min INTEGER NOT NULL DEFAULT 0 CHECK (col_min >= 0),
    col_max INTEGER NOT NULL DEFAULT 0 CHECK (col_max >= col_min),
    loot_table_id INTEGER,
    aggro_range REAL NOT NULL DEFAULT 5.0 CHECK (aggro_range > 0),
    patrol_range REAL NOT NULL DEFAULT 10.0 CHECK (patrol_range >= 0),
    respawn_time_ms INTEGER NOT NULL DEFAULT 30000 CHECK (respawn_time_ms > 0),
    attack_range REAL NOT NULL DEFAULT 2.0 CHECK (attack_range > 0),
    attackCooldown_ms INTEGER NOT NULL DEFAULT 2000 CHECK (attackCooldown_ms > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_monster_definitions_type ON sao.monster_definitions (monster_type);
CREATE INDEX idx_monster_definitions_level ON sao.monster_definitions (level);

CREATE TRIGGER trg_monster_definitions_updated_at
    BEFORE UPDATE ON sao.monster_definitions
    FOR EACH ROW EXECUTE FUNCTION sao.update_updated_at();
