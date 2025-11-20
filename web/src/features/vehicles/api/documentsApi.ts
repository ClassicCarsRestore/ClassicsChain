import { api } from '@/lib/api';
import type { Document, DocumentListResponse, GenerateDocumentUploadUrlResponse } from '../types/document';

export async function getVehicleDocuments(vehicleId: string): Promise<Document[]> {
  const response = await api.get<DocumentListResponse>(`/v1/vehicles/${vehicleId}/documents`);
  return response.data || [];
}

export async function generateDocumentUploadUrl(vehicleId: string, filename: string): Promise<GenerateDocumentUploadUrlResponse> {
  return api.post(`/v1/vehicles/${vehicleId}/documents/upload-url`, {
    filename,
  });
}

export async function confirmDocumentUpload(
  vehicleId: string,
  documentId: string
): Promise<Document> {
  return api.post(`/v1/vehicles/${vehicleId}/documents/${documentId}/confirm`);
}

export async function deleteVehicleDocument(vehicleId: string, documentId: string): Promise<void> {
  await api.delete(`/v1/vehicles/${vehicleId}/documents/${documentId}`);
}
