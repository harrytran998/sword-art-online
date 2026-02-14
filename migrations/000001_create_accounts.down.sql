DROP TRIGGER IF EXISTS trg_accounts_updated_at ON sao.accounts;
DROP FUNCTION IF EXISTS sao.update_updated_at();
DROP TABLE IF EXISTS sao.accounts;
DROP SCHEMA IF EXISTS sao;
