-- Create vehicle_documents table for storing document metadata
CREATE TABLE vehicle_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  object_key text NOT NULL,
  filename text NOT NULL,
  upload_url text NULL,
  created_at timestamp WITH time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_vehicle_document_key UNIQUE (vehicle_id, object_key)
);

CREATE INDEX idx_vehicle_documents_vehicle_id ON vehicle_documents(vehicle_id);
