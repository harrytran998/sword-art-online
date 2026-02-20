CREATE TABLE sao.character_inventory (
    id SERIAL PRIMARY KEY,
    character_id INTEGER NOT NULL REFERENCES sao.characters(id) ON DELETE CASCADE,
    item_def_id INTEGER NOT NULL REFERENCES sao.item_definitions(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity BETWEEN 1 AND 99),
    enhancement_level INTEGER NOT NULL DEFAULT 0 CHECK (enhancement_level BETWEEN 0 AND 15),
    enhancement_stats JSONB DEFAULT '{}',
    durability INTEGER,
    slot_type VARCHAR(16) CHECK (slot_type IN ('inventory', 'main_hand', 'off_hand', 'head', 'chest', 'hands', 'legs', 'feet', 'accessory1', 'accessory2', 'accessory3')),
    slot_index INTEGER CHECK (slot_index BETWEEN 0 AND 39),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    CONSTRAINT chk_slot_valid CHECK (
        (slot_type = 'inventory' AND slot_index BETWEEN 0 AND 39) OR
        (slot_type != 'inventory' AND slot_index IS NULL)
    )
);

CREATE INDEX idx_character_inventory_character ON sao.character_inventory (character_id);
CREATE INDEX idx_character_inventory_slot ON sao.character_inventory (character_id, slot_type, slot_index);
CREATE UNIQUE INDEX idx_character_inventory_unique_slot ON sao.character_inventory (character_id, slot_type, slot_index) WHERE slot_type IS NOT NULL;

CREATE TRIGGER trg_character_inventory_updated_at
    BEFORE UPDATE ON sao.character_inventory
    FOR EACH ROW EXECUTE FUNCTION sao.update_updated_at();
