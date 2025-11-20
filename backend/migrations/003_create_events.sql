CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    entity_id UUID NULL REFERENCES entities(id) ON DELETE RESTRICT,

    event_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    event_date DATE NOT NULL,
    location TEXT NOT NULL DEFAULT '',
    metadata JSONB,

    cid TEXT NULL,
    cid_source_json TEXT NULL,
    cid_source_cbor_b64 TEXT NULL,

    blockchain_tx_id TEXT NOT NULL DEFAULT '',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_vehicle_id ON events(vehicle_id);
CREATE INDEX idx_events_entity_id ON events(entity_id);
CREATE INDEX idx_events_event_type ON events(event_type);
CREATE INDEX idx_events_event_date ON events(event_date DESC);
CREATE UNIQUE INDEX idx_events_cid ON events(cid);

---- create above / drop below ----

DROP TABLE events;
