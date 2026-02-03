-- Create event_images table for storing images associated with events
-- Images are uploaded before event creation and linked via upload_session_id
-- CID is computed on confirm and included in blockchain anchoring
CREATE TABLE event_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NULL REFERENCES events(id) ON DELETE CASCADE,
  upload_session_id uuid NOT NULL,
  object_key text NOT NULL,
  cid text NULL,
  upload_url text NULL,
  created_at timestamp WITH time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_event_image_key UNIQUE (object_key)
);

CREATE INDEX idx_event_images_event_id ON event_images(event_id);
CREATE INDEX idx_event_images_upload_session_id ON event_images(upload_session_id);
CREATE INDEX idx_event_images_orphaned ON event_images(created_at) WHERE event_id IS NULL;

---- create above / drop below ----

DROP INDEX IF EXISTS idx_event_images_orphaned;
DROP INDEX IF EXISTS idx_event_images_upload_session_id;
DROP INDEX IF EXISTS idx_event_images_event_id;
DROP TABLE IF EXISTS event_images;
