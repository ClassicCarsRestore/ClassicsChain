import { useQuery } from '@tanstack/react-query';
import { verificationApi } from '../api/verificationApi';

export function useVehicleVerification(vehicleId: string) {
  return useQuery({
    queryKey: ['vehicleVerification', vehicleId],
    queryFn: () => verificationApi.getVehicleVerification(vehicleId),
    retry: 1,
    staleTime: 30_000,
  });
}

