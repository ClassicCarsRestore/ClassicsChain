import { api } from '@/lib/api';
import type { SharedVehicleData } from '@/types/shareLink';

export const passportApi = {
  getVehiclePassport: async (vehicleId: string) => {
    return await api.get<SharedVehicleData>(
      `/v1/public/passport/${vehicleId}`
    );
  },
};
