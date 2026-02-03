import { api } from '@/lib/api';
import type { EventImage, EventImageListResponse } from '@/types/vehicle';

export interface EventImageUploadSessionResponse {
  sessionId: string;
}

export interface GenerateEventImageUploadUrlResponse {
  imageId: string;
  uploadUrl: string;
}

export async function createUploadSession(): Promise<EventImageUploadSessionResponse> {
  return api.post('/v1/event-images/upload-session');
}

export async function generateUploadUrl(
  sessionId: string,
  filename: string
): Promise<GenerateEventImageUploadUrlResponse> {
  return api.post(`/v1/event-images/${sessionId}/upload-url`, { filename });
}

export async function confirmUpload(imageId: string): Promise<EventImage> {
  return api.post(`/v1/event-images/${imageId}/confirm`);
}

export async function getSessionImages(sessionId: string): Promise<EventImage[]> {
  const response = await api.get<EventImageListResponse>(`/v1/event-images/${sessionId}`);
  return response.data || [];
}

export async function deleteImage(imageId: string): Promise<void> {
  await api.delete(`/v1/event-images/${imageId}`);
}

export async function getEventImages(eventId: string): Promise<EventImage[]> {
  const response = await api.get<EventImageListResponse>(`/v1/events/${eventId}/images`);
  return response.data || [];
}
