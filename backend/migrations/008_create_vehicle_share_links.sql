CREATE TABLE vehicle_share_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  can_view_details boolean NOT NULL DEFAULT TRUE,
  can_view_photos boolean NOT NULL DEFAULT FALSE,
  can_view_documents boolean NOT NULL DEFAULT FALSE,
  can_view_history boolean NOT NULL DEFAULT FALSE,
  recipient_email text NULL,
  expires_at timestamp WITH time zone NOT NULL,
  created_at timestamp WITH time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  accessed_count int NOT NULL DEFAULT 0,
  last_accessed_at timestamp WITH time zone NULL,
  revoked_at timestamp WITH time zone NULL
);

CREATE INDEX idx_vehicle_share_links_vehicle_id ON vehicle_share_links(vehicle_id);
CREATE INDEX idx_vehicle_share_links_token ON vehicle_share_links(token);
CREATE INDEX idx_vehicle_share_links_expires_at ON vehicle_share_links(expires_at);

---- create above / drop below ----

DROP TABLE vehicle_share_links;
