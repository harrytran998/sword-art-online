-- Add CHECK constraint to enforce zone ID format (lowercase alphanumeric + underscores only)
ALTER TABLE sao.zone_definitions
  ADD CONSTRAINT chk_zone_id_format CHECK (id ~ '^[a-z0-9_]+$');
