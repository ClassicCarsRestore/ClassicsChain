export interface Vehicle {
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
  fuel?: string;
  engineCc?: number;
  engineCylinders?: number;
  enginePowerHp?: number;
  ownerId: string;
  blockchainAssetId?: string;
  cid?: string;
  cidSourceJson?: string;
  cidSourceCbor?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVehicleRequest {
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
  fuel?: string;
  engineCc?: number;
  engineCylinders?: number;
  enginePowerHp?: number;
}

export interface VehicleListResponse {
  data: Vehicle[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type EventType =
  | 'certification'
  | 'car_show'
  | 'classic_meet'
  | 'rally'
  | 'vintage_racing'
  | 'auction'
  | 'workshop'
  | 'club_competition'
  | 'road_trip'
  | 'festival'
  | 'race_participation'
  | 'show_participation'
  | 'maintenance'
  | 'ownership_transfer'
  | 'restoration'
  | 'modification';

export interface Event {
  id: string;
  vehicleId: string;
  entityId?: string;
  entityName?: string;
  entityLogoObjectKey?: string;
  type: EventType;
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
  images?: EventImage[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventRequest {
  vehicleId: string;
  entityId: string;
  type: EventType;
  title: string;
  description?: string;
  date?: string;
  location?: string;
  metadata?: Record<string, any>;
}

export interface CreateOwnerEventRequest {
  type: EventType;
  title: string;
  description?: string;
  date?: string;
  location?: string;
  imageSessionId?: string;
}

export interface EventImage {
  id: string;
  eventId?: string;
  uploadSessionId: string;
  objectKey: string;
  cid?: string;
  createdAt: string;
}

export interface EventImageListResponse {
  data: EventImage[];
}

export interface EventListResponse {
  data: Event[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

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

export interface GenerateDocumentUploadUrlRequest {
  filename: string;
}

export interface GenerateDocumentUploadUrlResponse {
  documentId: string;
  uploadUrl: string;
}
