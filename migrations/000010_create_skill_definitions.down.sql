DROP TRIGGER IF EXISTS trg_skill_definitions_updated_at ON sao.skill_definitions;
DROP INDEX IF EXISTS sao.idx_skill_definitions_level_req;
DROP INDEX IF EXISTS sao.idx_skill_definitions_weapon_type;
DROP TABLE IF EXISTS sao.skill_definitions;
