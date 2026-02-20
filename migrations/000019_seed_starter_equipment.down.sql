DELETE FROM sao.item_definitions WHERE name IN (
    -- Warrior equipment
    'Rusty One-Handed Sword', 'Worn Iron Helm', 'Worn Iron Chestplate', 'Worn Iron Gauntlets', 'Worn Iron Greaves', 'Worn Iron Boots',
    -- Ranger equipment
    'Beginner''s Short Bow', 'Leather Cap', 'Leather Vest', 'Leather Bracers', 'Leather Pants', 'Leather Boots',
    -- Mage equipment
    'Apprentice Staff', 'Apprentice Hood', 'Apprentice Robe', 'Apprentice Sleeves', 'Apprentice Skirt', 'Apprentice Slippers'
);
