-- Nullify orphan owner_id references before adding FK
UPDATE vehicles SET owner_id = NULL
WHERE owner_id IS NOT NULL AND owner_id NOT IN (SELECT id FROM users);

-- Add missing FK: vehicles.owner_id → users(id)
ALTER TABLE vehicles
  ADD CONSTRAINT vehicles_owner_id_fkey
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL;

-- Normalize timestamptz → timestamp (UTC, no timezone)
ALTER TABLE entities ALTER COLUMN created_at TYPE timestamp USING created_at AT TIME ZONE 'UTC';
ALTER TABLE entities ALTER COLUMN updated_at TYPE timestamp USING updated_at AT TIME ZONE 'UTC';

ALTER TABLE event_images ALTER COLUMN created_at TYPE timestamp USING created_at AT TIME ZONE 'UTC';

ALTER TABLE events ALTER COLUMN created_at TYPE timestamp USING created_at AT TIME ZONE 'UTC';

ALTER TABLE user_entity ALTER COLUMN added_at TYPE timestamp USING added_at AT TIME ZONE 'UTC';

ALTER TABLE users ALTER COLUMN created_at TYPE timestamp USING created_at AT TIME ZONE 'UTC';
ALTER TABLE users ALTER COLUMN updated_at TYPE timestamp USING updated_at AT TIME ZONE 'UTC';

ALTER TABLE vehicle_documents ALTER COLUMN created_at TYPE timestamp USING created_at AT TIME ZONE 'UTC';

ALTER TABLE vehicle_photos ALTER COLUMN created_at TYPE timestamp USING created_at AT TIME ZONE 'UTC';

ALTER TABLE vehicle_share_links ALTER COLUMN expires_at TYPE timestamp USING expires_at AT TIME ZONE 'UTC';
ALTER TABLE vehicle_share_links ALTER COLUMN created_at TYPE timestamp USING created_at AT TIME ZONE 'UTC';
ALTER TABLE vehicle_share_links ALTER COLUMN last_accessed_at TYPE timestamp USING last_accessed_at AT TIME ZONE 'UTC';
ALTER TABLE vehicle_share_links ALTER COLUMN revoked_at TYPE timestamp USING revoked_at AT TIME ZONE 'UTC';

ALTER TABLE vehicles ALTER COLUMN created_at TYPE timestamp USING created_at AT TIME ZONE 'UTC';
ALTER TABLE vehicles ALTER COLUMN updated_at TYPE timestamp USING updated_at AT TIME ZONE 'UTC';
