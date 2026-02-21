-- Seed Illfang the Kobold Lord (Floor 1 Boss)
-- Lv 15, 15000 HP (3 bars × 5000), high attack/defense, floor_boss type
INSERT INTO sao.monster_definitions (
  name, monster_type, level, hp, attack, defense,
  exp_reward, col_min, col_max, loot_table_id,
  aggro_range, patrol_range, respawn_time_ms,
  attack_range, attackCooldown_ms
) VALUES (
  'Illfang the Kobold Lord', 'boss', 15, 15000, 120, 80,
  50000, 10000, 15000, NULL,
  30, 5, 86400000,  -- 24h respawn
  5, 2000
);

-- Create boss loot table
INSERT INTO sao.loot_tables (name)
VALUES ('illfang_loot');

-- Get the IDs we need
-- Spawn point for boss room
INSERT INTO sao.monster_spawns (
  monster_def_id, zone_id, spawn_x, spawn_y, spawn_z,
  spawn_count, spawn_radius, is_active
)
SELECT md.id, 'floor_1_boss_room', 50, 0, 80, 1, 0, true
FROM sao.monster_definitions md
WHERE md.name = 'Illfang the Kobold Lord';

-- Link loot table to boss
UPDATE sao.monster_definitions
SET loot_table_id = (SELECT id FROM sao.loot_tables WHERE name = 'illfang_loot')
WHERE name = 'Illfang the Kobold Lord';

-- Loot table entries for boss drops
INSERT INTO sao.loot_table_entries (loot_table_id, item_name, drop_chance, quantity_min, quantity_max)
SELECT lt.id, 'Coat of Midnight', 1.0, 1, 1  -- Last Attack Bonus drop (100%)
FROM sao.loot_tables lt WHERE lt.name = 'illfang_loot';

INSERT INTO sao.loot_table_entries (loot_table_id, item_name, drop_chance, quantity_min, quantity_max)
SELECT lt.id, 'Guiding Plate', 1.0, 1, 1  -- Participation drop (100%)
FROM sao.loot_tables lt WHERE lt.name = 'illfang_loot';

-- Ruin Kobold Sentinel spawns (summoned during boss fight phase 1)
INSERT INTO sao.monster_definitions (
  name, monster_type, level, hp, attack, defense,
  exp_reward, col_min, col_max, loot_table_id,
  aggro_range, patrol_range, respawn_time_ms,
  attack_range, attackCooldown_ms
) VALUES (
  'Ruin Kobold Sentinel (Boss Add)', 'humanoid', 12, 3000, 60, 40,
  5000, 500, 1000, NULL,
  15, 3, 0,  -- No respawn (boss adds)
  3, 2500
);
