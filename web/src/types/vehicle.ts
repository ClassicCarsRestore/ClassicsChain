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
  ownerId: string;
  blockchainAddress?: string;
  ipfsHash?: string;
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
