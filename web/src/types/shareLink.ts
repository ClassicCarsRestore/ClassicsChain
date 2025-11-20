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

export interface SharedVehicleData {
  vehicle: SharedVehicle;
  photos?: Array<{
    id: string;
    vehicleId: string;
    objectKey: string;
    createdAt: string;
  }>;
  documents?: Array<{
    id: string;
    vehicleId: string;
    objectKey: string;
    filename: string;
    createdAt: string;
  }>;
  history?: Array<{
    id: string;
    vehicleId: string;
    entityId?: string;
    type: string;
    title: string;
    description?: string;
    date: string;
    location?: string;
    metadata?: Record<string, any>;
    blockchainTxId?: string;
    cid?: string;
    cidSourceJSON?: string;
    cidSourceCBOR?: string;
    ipfsHash?: string;
    createdAt: string;
    updatedAt: string;
  }>;
}

export interface SharedVehicle {
  id: string;
  licensePlate?: string;
  chassisNumber?: string;
  make: string;
  model: string;
  year: number;
  color?: string;
  engineNumber?: string;
  transmissionNumber?: string;
  bodyType?: string;
  driveType?: string;
  gearType?: string;
  suspensionType?: string;
  createdAt: string;
  updatedAt: string;
}
