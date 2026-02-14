-- Better Auth tables in sao schema
-- Tables: user, session, account, verification

CREATE TABLE sao."user" (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255),
    email_verified BOOLEAN NOT NULL DEFAULT false,
    image VARCHAR(1024),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sao.session (
    id VARCHAR(36) PRIMARY KEY,
    expires_at TIMESTAMPTZ NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ip_address VARCHAR(45),
    user_agent TEXT,
    user_id VARCHAR(36) NOT NULL REFERENCES sao."user"(id) ON DELETE CASCADE
);

CREATE TABLE sao.account (
    id VARCHAR(36) PRIMARY KEY,
    account_id VARCHAR(255) NOT NULL,
    provider_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(36) NOT NULL REFERENCES sao."user"(id) ON DELETE CASCADE,
    access_token TEXT,
    refresh_token TEXT,
    id_token TEXT,
    access_token_expires_at TIMESTAMPTZ,
    refresh_token_expires_at TIMESTAMPTZ,
    scope VARCHAR(255),
    password TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sao.verification (
    id VARCHAR(36) PRIMARY KEY,
    identifier VARCHAR(255) NOT NULL,
    value TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

CREATE INDEX idx_session_token ON sao.session (token);
CREATE INDEX idx_session_user_id ON sao.session (user_id);
CREATE INDEX idx_account_user_id ON sao.account (user_id);
CREATE INDEX idx_user_email ON sao."user" (email);

CREATE TRIGGER trg_user_updated_at
    BEFORE UPDATE ON sao."user"
    FOR EACH ROW EXECUTE FUNCTION sao.update_updated_at();

CREATE TRIGGER trg_session_updated_at
    BEFORE UPDATE ON sao.session
    FOR EACH ROW EXECUTE FUNCTION sao.update_updated_at();

CREATE TRIGGER trg_account_updated_at
    BEFORE UPDATE ON sao.account
    FOR EACH ROW EXECUTE FUNCTION sao.update_updated_at();
