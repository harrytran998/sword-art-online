-- Sword Art Online — Database Bootstrap
-- This runs automatically on first PostgreSQL container start.
-- Tables are managed by go-migrate migrations — only schema/extension setup here.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE SCHEMA IF NOT EXISTS sao;

ALTER DATABASE sao SET search_path TO sao, public;
