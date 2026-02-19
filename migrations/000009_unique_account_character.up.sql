-- Enforce one character per account
CREATE UNIQUE INDEX idx_characters_account_unique ON sao.characters (account_id);
