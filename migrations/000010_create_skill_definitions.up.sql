-- Create skill definitions table
CREATE TABLE sao.skill_definitions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    weapon_type VARCHAR(32) NOT NULL CHECK (weapon_type IN ('one_handed_sword', 'rapier', 'dagger', 'two_handed_sword', 'spear', 'bow', 'fist')),
    level_req INTEGER NOT NULL DEFAULT 1 CHECK (level_req BETWEEN 1 AND 100),
    hits INTEGER NOT NULL DEFAULT 1 CHECK (hits BETWEEN 1 AND 20),
    damage_multiplier REAL NOT NULL CHECK (damage_multiplier >= 1.0),
    mp_cost INTEGER NOT NULL DEFAULT 0 CHECK (mp_cost >= 0),
    cooldown_ms INTEGER NOT NULL CHECK (cooldown_ms > 0),
    range REAL NOT NULL DEFAULT 2.0 CHECK (range > 0),
    pre_motion_ms INTEGER NOT NULL CHECK (pre_motion_ms >= 0),
    execution_ms INTEGER NOT NULL CHECK (execution_ms > 0),
    post_motion_ms INTEGER NOT NULL CHECK (post_motion_ms >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_skill_definitions_weapon_type ON sao.skill_definitions (weapon_type);
CREATE INDEX idx_skill_definitions_level_req ON sao.skill_definitions (level_req);

CREATE TRIGGER trg_skill_definitions_updated_at
    BEFORE UPDATE ON sao.skill_definitions
    FOR EACH ROW EXECUTE FUNCTION sao.update_updated_at();
