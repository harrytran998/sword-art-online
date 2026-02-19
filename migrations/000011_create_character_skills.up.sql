-- Create character skills table
CREATE TABLE sao.character_skills (
    character_id UUID NOT NULL REFERENCES sao.characters(id) ON DELETE CASCADE,
    skill_id INTEGER NOT NULL REFERENCES sao.skill_definitions(id) ON DELETE CASCADE,
    level INTEGER NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 10),
    proficiency INTEGER NOT NULL DEFAULT 0 CHECK (proficiency >= 0),
    slot_index INTEGER CHECK (slot_index BETWEEN 0 AND 8),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (character_id, skill_id)
);

CREATE INDEX idx_character_skills_character ON sao.character_skills (character_id);
CREATE INDEX idx_character_skills_slot ON sao.character_skills (character_id, slot_index) WHERE slot_index IS NOT NULL;

CREATE TRIGGER trg_character_skills_updated_at
    BEFORE UPDATE ON sao.character_skills
    FOR EACH ROW EXECUTE FUNCTION sao.update_updated_at();
