-- Better Auth JWT plugin table (uses camelCase columns to match plugin schema)
CREATE TABLE sao.jwks (
    id VARCHAR(36) PRIMARY KEY,
    "publicKey" TEXT NOT NULL,
    "privateKey" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "expiresAt" TIMESTAMPTZ
);
