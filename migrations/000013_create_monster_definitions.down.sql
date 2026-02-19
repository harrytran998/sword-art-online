DROP TRIGGER IF EXISTS trg_monster_definitions_updated_at ON sao.monster_definitions;
DROP INDEX IF EXISTS sao.idx_monster_definitions_level;
DROP INDEX IF EXISTS sao.idx_monster_definitions_type;
DROP TABLE IF EXISTS sao.monster_definitions;
