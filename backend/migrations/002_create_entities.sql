CREATE TABLE entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    contact_email TEXT NOT NULL,
    website TEXT NOT NULL DEFAULT '',
    address JSONB,
    certified_by UUID REFERENCES entities(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_entities_entity_type ON entities(entity_type);

---- create above / drop below ----

DROP TABLE entities;
