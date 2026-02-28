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

export function useVehicleLookup(chassisNumber: string, enabled: boolean) {
  return useQuery({
    queryKey: ['vehicleLookup', chassisNumber],
    queryFn: () => verificationApi.lookupByChassisNumber(chassisNumber),
    enabled: enabled && chassisNumber.length > 0,
    retry: 1,
  });
}
