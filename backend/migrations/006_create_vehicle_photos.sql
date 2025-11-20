-- Create vehicle_photos table
CREATE TABLE vehicle_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  object_key text NOT NULL,
  upload_url text NULL,
  created_at timestamp WITH time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_vehicle_photo_key UNIQUE (vehicle_id, object_key)
);

-- Create index on vehicle_id for efficient queries
CREATE INDEX idx_vehicle_photos_vehicle_id ON vehicle_photos(vehicle_id);
