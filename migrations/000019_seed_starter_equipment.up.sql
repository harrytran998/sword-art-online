-- Seed starter equipment for each class
-- Each class gets: weapon, head, chest, hands, legs, feet

-- Warrior starter equipment (one-handed sword + heavy armor)
INSERT INTO sao.item_definitions (name, description, category, subcategory, rarity, stats, requirements, max_stack, tradeable, base_price) VALUES
-- Warrior Weapons
('Rusty One-Handed Sword', 'A basic sword for beginners. Slightly dull but still effective.', 'weapon', 'one_handed_sword', 'common', 
 '{"attack": 5, "criticalRate": 1}', '{"level": 1, "class": ["warrior"]}', 1, true, 50),

-- Warrior Armor (Heavy)
('Worn Iron Helm', 'A simple iron helmet that offers basic protection.', 'armor', 'head', 'common',
 '{"defense": 3, "vitality": 1}', '{"level": 1, "class": ["warrior"]}', 1, true, 30),
('Worn Iron Chestplate', 'A basic iron chestplate. Heavy but protective.', 'armor', 'chest', 'common',
 '{"defense": 8, "vitality": 3}', '{"level": 1, "class": ["warrior"]}', 1, true, 80),
('Worn Iron Gauntlets', 'Iron gloves that protect the hands.', 'armor', 'hands', 'common',
 '{"defense": 2, "strength": 1}', '{"level": 1, "class": ["warrior"]}', 1, true, 25),
('Worn Iron Greaves', 'Iron leg armor for basic leg protection.', 'armor', 'legs', 'common',
 '{"defense": 4, "vitality": 1}', '{"level": 1, "class": ["warrior"]}', 1, true, 40),
('Worn Iron Boots', 'Heavy iron boots that protect the feet.', 'armor', 'feet', 'common',
 '{"defense": 2, "vitality": 1}', '{"level": 1, "class": ["warrior"]}', 1, true, 30);

-- Ranger starter equipment (bow + light armor)
INSERT INTO sao.item_definitions (name, description, category, subcategory, rarity, stats, requirements, max_stack, tradeable, base_price) VALUES
-- Ranger Weapons
('Beginner''s Short Bow', 'A simple bow for novice rangers.', 'weapon', 'bow', 'common',
 '{"attack": 4, "criticalRate": 3}', '{"level": 1, "class": ["ranger"]}', 1, true, 50),

-- Ranger Armor (Light)
('Leather Cap', 'A simple leather cap for head protection.', 'armor', 'head', 'common',
 '{"defense": 1, "agility": 2}', '{"level": 1, "class": ["ranger"]}', 1, true, 25),
('Leather Vest', 'A lightweight leather vest for mobility.', 'armor', 'chest', 'common',
 '{"defense": 3, "agility": 3}', '{"level": 1, "class": ["ranger"]}', 1, true, 60),
('Leather Bracers', 'Leather arm guards for better aim.', 'armor', 'hands', 'common',
 '{"defense": 1, "agility": 2}', '{"level": 1, "class": ["ranger"]}', 1, true, 20),
('Leather Pants', 'Light leather pants for easy movement.', 'armor', 'legs', 'common',
 '{"defense": 2, "agility": 2}', '{"level": 1, "class": ["ranger"]}', 1, true, 35),
('Leather Boots', 'Lightweight boots for swift movement.', 'armor', 'feet', 'common',
 '{"defense": 1, "agility": 3}', '{"level": 1, "class": ["ranger"]}', 1, true, 25);

-- Mage starter equipment (staff + cloth armor)
INSERT INTO sao.item_definitions (name, description, category, subcategory, rarity, stats, requirements, max_stack, tradeable, base_price) VALUES
-- Mage Weapons
('Apprentice Staff', 'A simple wooden staff for beginning mages.', 'weapon', 'staff', 'common',
 '{"attack": 2, "intelligence": 5}', '{"level": 1, "class": ["mage"]}', 1, true, 50),

-- Mage Armor (Cloth)
('Apprentice Hood', 'A simple cloth hood.', 'armor', 'head', 'common',
 '{"defense": 1, "intelligence": 2, "maxMp": 10}', '{"level": 1, "class": ["mage"]}', 1, true, 25),
('Apprentice Robe', 'A basic robe for aspiring mages.', 'armor', 'chest', 'common',
 '{"defense": 2, "intelligence": 3, "maxMp": 20}', '{"level": 1, "class": ["mage"]}', 1, true, 60),
('Apprentice Sleeves', 'Cloth sleeves with minor magical enhancement.', 'armor', 'hands', 'common',
 '{"defense": 1, "intelligence": 1}', '{"level": 1, "class": ["mage"]}', 1, true, 20),
('Apprentice Skirt', 'A cloth skirt for mages.', 'armor', 'legs', 'common',
 '{"defense": 1, "intelligence": 2, "maxMp": 10}', '{"level": 1, "class": ["mage"]}', 1, true, 35),
('Apprentice Slippers', 'Light cloth footwear for mages.', 'armor', 'feet', 'common',
 '{"defense": 1, "intelligence": 1, "agility": 1}', '{"level": 1, "class": ["mage"]}', 1, true, 25);
