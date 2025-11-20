CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NULL,

    chassis_number TEXT NOT NULL DEFAULT '',
    license_plate TEXT NOT NULL DEFAULT '',
    engine_number TEXT NOT NULL DEFAULT '',
    transmission_number TEXT NOT NULL DEFAULT '',
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INT NOT NULL,
    color TEXT NOT NULL DEFAULT '',
    body_type TEXT NOT NULL DEFAULT '',
    drive_type TEXT NOT NULL DEFAULT '',
    gear_type TEXT NOT NULL DEFAULT '',
    suspension_type TEXT NOT NULL DEFAULT '',

    cid TEXT NULL,
    cid_source_json TEXT NULL,
    cid_source_cbor_b64 TEXT NULL,

    blockchain_asset_id TEXT NOT NULL DEFAULT '',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_vehicles_chassis_number ON vehicles(chassis_number) WHERE chassis_number != '';
CREATE UNIQUE INDEX idx_vehicles_license_plate ON vehicles(license_plate) WHERE license_plate != '';
CREATE UNIQUE INDEX idx_vehicles_engine_number ON vehicles(engine_number) WHERE engine_number != '';
CREATE UNIQUE INDEX idx_vehicles_transmission_number ON vehicles(transmission_number) WHERE transmission_number != '';
CREATE UNIQUE INDEX idx_vehicles_blockchain_asset_id ON vehicles(blockchain_asset_id) WHERE blockchain_asset_id != '';
CREATE UNIQUE INDEX idx_vehicles_cid ON vehicles(cid);
CREATE INDEX idx_vehicles_owner_id ON vehicles(owner_id);

---- create above / drop below ----

DROP TABLE vehicles;
