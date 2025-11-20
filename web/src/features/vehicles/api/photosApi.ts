import { api } from '@/lib/api';
import type { Photo, PhotoListResponse } from '../types/photo';

export async function getVehiclePhotos(vehicleId: string): Promise<Photo[]> {
  const response = await api.get<PhotoListResponse>(`/v1/vehicles/${vehicleId}/photos`);
  return response.data || [];
}

export async function generatePhotoUploadUrl(vehicleId: string, filename: string): Promise<{ photoId: string; uploadUrl: string }> {
  return api.post(`/v1/vehicles/${vehicleId}/photos/upload-url`, {
    filename,
  });
}

export async function confirmPhotoUpload(
  vehicleId: string,
  photoId: string
): Promise<Photo> {
  return api.post(`/v1/vehicles/${vehicleId}/photos/${photoId}/confirm`);
}

export async function deleteVehiclePhoto(vehicleId: string, photoId: string): Promise<void> {
  await api.delete(`/v1/vehicles/${vehicleId}/photos/${photoId}`);
}
