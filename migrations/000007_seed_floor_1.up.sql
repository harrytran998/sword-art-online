-- Seed Floor 1: Town of Beginnings and surrounding zones
INSERT INTO sao.floor_definitions (id, name, description, level_requirement, is_unlocked)
VALUES (1, 'Floor 1 — Town of Beginnings', 'The first floor of Aincrad. Home to the Town of Beginnings and surrounding wilderness.', 1, true);

INSERT INTO sao.zone_definitions (id, floor_id, name, description, zone_type, is_safe_zone, min_x, min_z, max_x, max_z, spawn_x, spawn_y, spawn_z, max_players)
VALUES
    ('floor_1_town',       1, 'Town of Beginnings', 'The central safe haven of Floor 1. NPCs and shops.', 'town',      true,   0,   0, 200, 200, 100, 0, 100, 500),
    ('floor_1_field_west', 1, 'Western Field',      'Open grassland west of town. Low-level monsters.',    'field',     false, -200, 0,   0, 200, -50, 0, 100, 300),
    ('floor_1_field_east', 1, 'Eastern Field',      'Rolling hills east of town. Moderate monsters.',      'field',     false, 200,  0, 400, 200, 250, 0, 100, 300),
    ('floor_1_forest',     1, 'First Forest',       'Dense forest to the north. Dangerous beasts lurk.',   'forest',    false,  0, 200, 200, 400,  100, 0, 250, 200),
    ('floor_1_labyrinth',  1, 'Floor 1 Labyrinth',  'The dungeon tower leading to the Floor 1 boss.',      'labyrinth', false, 50, 400, 150, 500,  100, 0, 420, 100);
