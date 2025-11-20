import { api } from '@/lib/api';
import type {
  CreateShareLinkRequest,
  CreateShareLinkResponse,
  ShareLinkListResponse,
  SharedVehicleData,
} from '@/types/shareLink';

export const shareLinksApi = {
  getVehicleShareLinks: async (vehicleId: string) => {
    const response = await api.get<ShareLinkListResponse>(
      `/v1/vehicles/${vehicleId}/share-links`
    );
    return response;
  },

  createShareLink: async (vehicleId: string, data: CreateShareLinkRequest) => {
    const response = await api.post<CreateShareLinkResponse>(
      `/v1/vehicles/${vehicleId}/share-links`,
      data
    );
    return response;
  },

  revokeShareLink: async (vehicleId: string, shareLinkId: string) => {
    await api.delete(`/v1/vehicles/${vehicleId}/share-links/${shareLinkId}`);
  },

  getSharedVehicle: async (token: string) => {
    const response = await api.get<SharedVehicleData>(
      `/v1/shared/vehicles/${token}`
    );
    return response;
  },
};
