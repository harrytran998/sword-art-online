DROP TRIGGER IF EXISTS trg_character_skills_updated_at ON sao.character_skills;
DROP INDEX IF EXISTS sao.idx_character_skills_slot;
DROP INDEX IF EXISTS sao.idx_character_skills_character;
DROP TABLE IF EXISTS sao.character_skills;
