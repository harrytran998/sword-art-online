CREATE TABLE sao.loot_tables (
    id SERIAL PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sao.loot_table_entries (
    id SERIAL PRIMARY KEY,
    loot_table_id INTEGER NOT NULL REFERENCES sao.loot_tables(id) ON DELETE CASCADE,
    item_name VARCHAR(64) NOT NULL,
    drop_chance REAL NOT NULL CHECK (drop_chance > 0 AND drop_chance <= 1.0),
    quantity_min INTEGER NOT NULL DEFAULT 1 CHECK (quantity_min >= 1),
    quantity_max INTEGER NOT NULL DEFAULT 1 CHECK (quantity_max >= quantity_min),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_loot_table_entries_table ON sao.loot_table_entries (loot_table_id);
