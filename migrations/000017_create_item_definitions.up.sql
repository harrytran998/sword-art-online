CREATE TABLE sao.item_definitions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    description TEXT,
    category VARCHAR(32) NOT NULL CHECK (category IN ('weapon', 'armor', 'accessory', 'consumable', 'material', 'crystal')),
    subcategory VARCHAR(32),
    rarity VARCHAR(16) NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
    stats JSONB DEFAULT '{}',
    requirements JSONB DEFAULT '{}',
    max_stack INTEGER NOT NULL DEFAULT 1 CHECK (max_stack BETWEEN 1 AND 99),
    tradeable BOOLEAN NOT NULL DEFAULT true,
    base_price INTEGER NOT NULL DEFAULT 0 CHECK (base_price >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_item_definitions_category ON sao.item_definitions (category);
CREATE INDEX idx_item_definitions_rarity ON sao.item_definitions (rarity);
CREATE INDEX idx_item_definitions_subcategory ON sao.item_definitions (subcategory);
