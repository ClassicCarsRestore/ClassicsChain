CREATE TABLE user_entity (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, entity_id)
);

CREATE INDEX idx_user_entity_user_id ON user_entity(user_id);
CREATE INDEX idx_user_entity_entity_id ON user_entity(entity_id);

---- create above / drop below ----

DROP TABLE user_entity;
