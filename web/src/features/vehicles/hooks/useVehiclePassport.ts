import { useQuery } from '@tanstack/react-query';
import { passportApi } from '../api/passportApi';

export function useVehiclePassport(vehicleId: string) {
  return useQuery({
    queryKey: ['vehiclePassport', vehicleId],
    queryFn: () => passportApi.getVehiclePassport(vehicleId),
    retry: 1,
    staleTime: 30_000,
  });
}
