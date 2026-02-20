CREATE TABLE sao.monster_spawns (
    id SERIAL PRIMARY KEY,
    monster_def_id INTEGER NOT NULL REFERENCES sao.monster_definitions(id) ON DELETE CASCADE,
    zone_id VARCHAR(64) NOT NULL REFERENCES sao.zone_definitions(id) ON DELETE CASCADE,
    spawn_x REAL NOT NULL,
    spawn_y REAL NOT NULL DEFAULT 0,
    spawn_z REAL NOT NULL,
    spawn_count INTEGER NOT NULL DEFAULT 1 CHECK (spawn_count BETWEEN 1 AND 20),
    spawn_radius REAL NOT NULL DEFAULT 5.0 CHECK (spawn_radius >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_monster_spawns_zone ON sao.monster_spawns (zone_id);
CREATE INDEX idx_monster_spawns_active ON sao.monster_spawns (is_active) WHERE is_active = true;

CREATE TRIGGER trg_monster_spawns_updated_at
    BEFORE UPDATE ON sao.monster_spawns
    FOR EACH ROW EXECUTE FUNCTION sao.update_updated_at();
