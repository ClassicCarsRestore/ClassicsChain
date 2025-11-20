import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { shareLinksApi } from '../api/shareLinksApi';
import type { CreateShareLinkRequest } from '@/types/shareLink';

const SHARE_LINKS_QUERY_KEY = (vehicleId: string) => ['shareLinks', vehicleId];
const SHARED_VEHICLE_QUERY_KEY = (token: string) => ['sharedVehicle', token];

export function useVehicleShareLinks(vehicleId: string) {
  return useQuery({
    queryKey: SHARE_LINKS_QUERY_KEY(vehicleId),
    queryFn: () => shareLinksApi.getVehicleShareLinks(vehicleId),
  });
}

export function useCreateShareLink(vehicleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateShareLinkRequest) =>
      shareLinksApi.createShareLink(vehicleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHARE_LINKS_QUERY_KEY(vehicleId) });
    },
  });
}

export function useRevokeShareLink(vehicleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (shareLinkId: string) =>
      shareLinksApi.revokeShareLink(vehicleId, shareLinkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHARE_LINKS_QUERY_KEY(vehicleId) });
    },
  });
}

export function useSharedVehicle(token: string) {
  return useQuery({
    queryKey: SHARED_VEHICLE_QUERY_KEY(token),
    queryFn: () => shareLinksApi.getSharedVehicle(token),
    retry: 1,
    staleTime: 0,
  });
}
