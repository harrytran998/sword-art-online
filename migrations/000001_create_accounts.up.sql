-- Create accounts table
CREATE SCHEMA IF NOT EXISTS sao;

CREATE TABLE sao.accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(32) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'banned', 'suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_accounts_email ON sao.accounts (email);
CREATE INDEX idx_accounts_username ON sao.accounts (username);
CREATE INDEX idx_accounts_status ON sao.accounts (status);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION sao.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_accounts_updated_at
    BEFORE UPDATE ON sao.accounts
    FOR EACH ROW EXECUTE FUNCTION sao.update_updated_at();
