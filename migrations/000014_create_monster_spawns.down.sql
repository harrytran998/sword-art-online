DROP TRIGGER IF EXISTS trg_monster_spawns_updated_at ON sao.monster_spawns;
DROP INDEX IF EXISTS sao.idx_monster_spawns_active;
DROP INDEX IF EXISTS sao.idx_monster_spawns_zone;
DROP TABLE IF EXISTS sao.monster_spawns;
