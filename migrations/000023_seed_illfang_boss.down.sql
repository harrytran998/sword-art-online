-- Remove boss adds
DELETE FROM sao.monster_definitions WHERE name = 'Ruin Kobold Sentinel (Boss Add)';

-- Remove loot table entries
DELETE FROM sao.loot_table_entries
WHERE loot_table_id = (SELECT id FROM sao.loot_tables WHERE name = 'illfang_loot');

-- Remove spawn point
DELETE FROM sao.monster_spawns
WHERE monster_def_id = (SELECT id FROM sao.monster_definitions WHERE name = 'Illfang the Kobold Lord');

-- Remove loot table
DELETE FROM sao.loot_tables WHERE name = 'illfang_loot';

-- Remove boss definition
DELETE FROM sao.monster_definitions WHERE name = 'Illfang the Kobold Lord';
