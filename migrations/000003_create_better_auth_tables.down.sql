DROP TRIGGER IF EXISTS trg_account_updated_at ON sao.account;
DROP TRIGGER IF EXISTS trg_session_updated_at ON sao.session;
DROP TRIGGER IF EXISTS trg_user_updated_at ON sao."user";

DROP TABLE IF EXISTS sao.verification;
DROP TABLE IF EXISTS sao.account;
DROP TABLE IF EXISTS sao.session;
DROP TABLE IF EXISTS sao."user";
