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
