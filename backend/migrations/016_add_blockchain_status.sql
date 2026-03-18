ALTER TABLE vehicles ADD COLUMN blockchain_status TEXT NOT NULL DEFAULT 'none';
ALTER TABLE events ADD COLUMN blockchain_status TEXT NOT NULL DEFAULT 'none';

-- Backfill existing anchored data
UPDATE vehicles SET blockchain_status = 'anchored' WHERE blockchain_asset_id IS NOT NULL AND blockchain_asset_id != '';
UPDATE events SET blockchain_status = 'anchored' WHERE blockchain_tx_id IS NOT NULL AND blockchain_tx_id != '';

---- create above / drop below ----

ALTER TABLE vehicles DROP COLUMN blockchain_status;
ALTER TABLE events DROP COLUMN blockchain_status;
