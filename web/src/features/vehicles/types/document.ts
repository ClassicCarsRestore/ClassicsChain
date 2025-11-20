export interface Document {
  id: string;
  vehicleId: string;
  objectKey: string;
  filename: string;
  createdAt: string;
}

export interface DocumentListResponse {
  data: Document[];
}

export interface GenerateDocumentUploadUrlResponse {
  documentId: string;
  uploadUrl: string;
}
