import type { Vehicle, Event } from '@/types/vehicle';

export interface SharePermissions {
  canViewDetails: boolean;
  canViewPhotos: boolean;
  canViewDocuments: boolean;
  canViewHistory: boolean;
}

export type ShareLinkDuration = '1h' | '24h' | '7d' | '30d';

export interface CreateShareLinkRequest {
  canViewDetails: boolean;
  canViewPhotos: boolean;
  canViewDocuments: boolean;
  canViewHistory: boolean;
  duration: ShareLinkDuration;
  recipientEmail?: string;
}

export interface ShareLink {
  id: string;
  vehicleId: string;
  token: string;
  permissions: SharePermissions;
  expiresAt: string;
  accessedCount?: number;
  lastAccessedAt?: string;
  createdAt?: string;
  revokedAt?: string;
}

export interface CreateShareLinkResponse {
  id: string;
  vehicleId: string;
  shareUrl: string;
  expiresAt: string;
  permissions: SharePermissions;
}

export interface ShareLinkListResponse {
  data: ShareLink[];
}

export interface SharedPhoto {
  id: string;
  vehicleId: string;
  objectKey: string;
  createdAt: string;
}

export interface SharedDocument {
  id: string;
  vehicleId: string;
  objectKey: string;
  filename: string;
  createdAt: string;
}

export interface SharedVehicleData {
  vehicle: Vehicle;
  photos?: SharedPhoto[];
  documents?: SharedDocument[];
  history?: Event[];
}
