export interface Photo {
  id: string;
  vehicleId: string;
  objectKey: string;
  uploadUrl?: string | null;
  createdAt: string;
}

export interface PhotoListResponse {
  data: Photo[];
}
