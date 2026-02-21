-- Seed Floor 1 Boss Room zone
INSERT INTO sao.zone_definitions (
  id, floor_id, name, description, zone_type,
  is_safe_zone, min_x, min_z, max_x, max_z,
  spawn_x, spawn_y, spawn_z, max_players
) VALUES (
  'floor_1_boss_room', 1, 'Floor 1 Boss Room',
  'The sealed chamber atop the Labyrinth Tower where Illfang the Kobold Lord awaits. Teleport crystals are disabled within.',
  'boss', false,
  0, 0, 100, 100,
  50, 0, 10, 48
);
