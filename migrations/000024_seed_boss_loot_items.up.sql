-- Seed boss loot items
INSERT INTO sao.item_definitions (
  name, description, category, subcategory, rarity,
  stats, requirements, max_stack, tradeable, base_price
) VALUES
(
  'Coat of Midnight',
  'A jet-black coat that seems to absorb light. Awarded to the player who lands the final blow on Illfang the Kobold Lord.',
  'armor', 'chest', 'legendary',
  '{"defense": 25, "agi": 8, "evasion": 5}',
  '{"level": 10}',
  1, false, 0
),
(
  'Guiding Plate',
  'A sturdy plate armor awarded to participants in the defeat of Illfang the Kobold Lord. Bears the mark of the first floor conquest.',
  'armor', 'chest', 'rare',
  '{"defense": 18, "vit": 5}',
  '{"level": 8}',
  1, true, 5000
);
