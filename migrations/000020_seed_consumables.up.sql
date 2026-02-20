-- Seed consumables: HP Potions, MP Potions, Antidote, Teleport Crystals

INSERT INTO sao.item_definitions (name, description, category, subcategory, rarity, stats, requirements, max_stack, tradeable, base_price) VALUES
-- HP Potions
('Small HP Potion', 'Restores 50 HP instantly. A basic healing potion.', 'consumable', 'potion', 'common',
 '{"healHp": 50}', '{}', 20, true, 25),
('Medium HP Potion', 'Restores 150 HP instantly. A standard healing potion.', 'consumable', 'potion', 'uncommon',
 '{"healHp": 150}', '{"level": 5}', 20, true, 75),
('Large HP Potion', 'Restores 400 HP instantly. A powerful healing potion.', 'consumable', 'potion', 'rare',
 '{"healHp": 400}', '{"level": 15}', 20, true, 200),

-- MP Potions
('Small MP Potion', 'Restores 30 MP instantly. A basic mana potion.', 'consumable', 'potion', 'common',
 '{"healMp": 30}', '{}', 20, true, 30),
('Medium MP Potion', 'Restores 100 MP instantly. A standard mana potion.', 'consumable', 'potion', 'uncommon',
 '{"healMp": 100}', '{"level": 5}', 20, true, 90),
('Large MP Potion', 'Restores 250 MP instantly. A powerful mana potion.', 'consumable', 'potion', 'rare',
 '{"healMp": 250}', '{"level": 15}', 20, true, 250),

-- Status Cure
('Antidote', 'Cures poison status effect.', 'consumable', 'potion', 'common',
 '{"cureStatus": ["poison"]}', '{}', 10, true, 50),
('Remedy', 'Cures all negative status effects.', 'consumable', 'potion', 'uncommon',
 '{"cureStatus": ["poison", "paralyze", "curse", "blind"]}', '{"level": 10}', 10, true, 200),

-- Teleport Crystals
('Teleport Crystal', 'Instantly teleports you to a previously visited town. Single use.', 'crystal', 'teleport', 'uncommon',
 '{"teleport": true}', '{}', 5, true, 500),
('Corridor Crystal', 'Teleports you to any floor you have unlocked. Single use.', 'crystal', 'teleport', 'rare',
 '{"teleportFloor": true}', '{"level": 10}', 5, true, 1500),

-- Buff Items
('Attack Gem', 'Temporarily increases attack by 10% for 60 seconds.', 'consumable', 'gem', 'uncommon',
 '{"buffAttack": 10, "buffDuration": 60}', '{"level": 5}', 10, true, 100),
('Defense Gem', 'Temporarily increases defense by 10% for 60 seconds.', 'consumable', 'gem', 'uncommon',
 '{"buffDefense": 10, "buffDuration": 60}', '{"level": 5}', 10, true, 100),
('Speed Gem', 'Temporarily increases movement speed by 20% for 30 seconds.', 'consumable', 'gem', 'uncommon',
 '{"buffSpeed": 20, "buffDuration": 30}', '{"level": 5}', 10, true, 100);
