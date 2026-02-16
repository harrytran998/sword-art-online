-- Create zone definitions table
CREATE TABLE sao.zone_definitions (
    id VARCHAR(64) PRIMARY KEY,
    floor_id INTEGER NOT NULL REFERENCES sao.floor_definitions(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    zone_type VARCHAR(32) NOT NULL DEFAULT 'field' CHECK (zone_type IN ('town', 'field', 'forest', 'labyrinth', 'boss')),
    is_safe_zone BOOLEAN NOT NULL DEFAULT false,
    -- Zone bounds (rectangular area)
    min_x REAL NOT NULL DEFAULT 0,
    min_z REAL NOT NULL DEFAULT 0,
    max_x REAL NOT NULL DEFAULT 100,
    max_z REAL NOT NULL DEFAULT 100,
    -- Default spawn point
    spawn_x REAL NOT NULL DEFAULT 50,
    spawn_y REAL NOT NULL DEFAULT 0,
    spawn_z REAL NOT NULL DEFAULT 50,
    max_players INTEGER NOT NULL DEFAULT 500 CHECK (max_players > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_zone_definitions_floor ON sao.zone_definitions (floor_id);
CREATE INDEX idx_zone_definitions_type ON sao.zone_definitions (zone_type);

CREATE TRIGGER trg_zone_definitions_updated_at
    BEFORE UPDATE ON sao.zone_definitions
    FOR EACH ROW EXECUTE FUNCTION sao.update_updated_at();
