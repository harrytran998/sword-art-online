DELETE FROM sao.item_definitions WHERE name IN (
    -- Common materials
    'Boar Hide', 'Boar Tusk', 'Wolf Pelt', 'Wolf Fang', 'Kobold Ear', 'Kobold Coin Pouch',
    'Wasp Wing', 'Wasp Stinger', 'Goblin Tooth', 'Goblin Blade',
    -- Uncommon/Rare materials
    'Golem Core Fragment', 'Treant Bark', 'Treant Sap', 'Skeleton Bone', 'Ancient Arrow',
    'Shadow Essence', 'Kobold Sentinel Badge',
    -- Equipment
    'Iron Sword', 'Hunting Bow', 'Mage''s Rod', 'Steel Shield', 'Padded Leather Armor', 'Enchanter''s Robe',
    -- Accessories
    'Wolf''s Eye Ring', 'Boar''s Tusk Necklace', 'Wasp Wing Earring',
    -- Rare drops
    'Sentinel''s Blade', 'Shadow Cloak', 'Golem''s Heart'
);
