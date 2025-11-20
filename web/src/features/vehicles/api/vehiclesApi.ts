import { api } from '@/lib/api';
import type { Vehicle, CreateVehicleRequest, VehicleListResponse } from '../types/vehicle';

export const vehiclesApi = {
  getVehicles: async (ownerId?: string) => {
    const params = new URLSearchParams();
    if (ownerId) params.append('ownerId', ownerId);

    const response = await api.get<VehicleListResponse>(
      `/v1/vehicles?${params.toString()}`
    );
    return response;
  },

  getVehicle: async (id: string) => {
    const response = await api.get<Vehicle>(`/v1/vehicles/${id}`);
    return response;
  },

  createVehicle: (data: CreateVehicleRequest) =>
    api.post<Vehicle>('/v1/vehicles', data),

  updateVehicle: (id: string, data: Partial<CreateVehicleRequest>) =>
    api.put<Vehicle>(`/v1/vehicles/${id}`, data),
};
