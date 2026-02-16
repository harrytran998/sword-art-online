-- Create floor definitions table
CREATE TABLE sao.floor_definitions (
    id INTEGER PRIMARY KEY CHECK (id BETWEEN 1 AND 100),
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    level_requirement INTEGER NOT NULL DEFAULT 1 CHECK (level_requirement BETWEEN 1 AND 100),
    is_unlocked BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_floor_definitions_unlocked ON sao.floor_definitions (is_unlocked);

CREATE TRIGGER trg_floor_definitions_updated_at
    BEFORE UPDATE ON sao.floor_definitions
    FOR EACH ROW EXECUTE FUNCTION sao.update_updated_at();
