import { api } from '@/lib/api';
import type { VehicleVerificationResponse } from '@/types/verification';

export const verificationApi = {
  getVehicleVerification: async (vehicleId: string) => {
    return await api.get<VehicleVerificationResponse>(
      `/v1/public/verify/${vehicleId}`
    );
  },
};
