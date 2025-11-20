import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vehiclesApi } from '../api/vehiclesApi';
import { eventsApi } from '../api/eventsApi';
import type { CreateVehicleRequest, CreateEventRequest } from '@/types/vehicle';

export const useVehicles = (ownerId?: string) => {
  return useQuery({
    queryKey: ['vehicles', ownerId],
    queryFn: () => vehiclesApi.getVehicles(ownerId),
    enabled: !!ownerId,
  });
};

export const useVehicle = (id: string) => {
  return useQuery({
    queryKey: ['vehicles', id],
    queryFn: () => vehiclesApi.getVehicle(id),
    enabled: !!id,
    retry: false,
  });
};

export const useCreateVehicle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateVehicleRequest) => vehiclesApi.createVehicle(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });
};

export const useVehicleEvents = (vehicleId: string) => {
  return useQuery({
    queryKey: ['vehicles', vehicleId, 'events'],
    queryFn: () => eventsApi.getVehicleEvents(vehicleId),
    enabled: !!vehicleId,
  });
};

export const useCreateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEventRequest) => eventsApi.createEvent(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['vehicles', variables.vehicleId, 'events'],
      });
    },
  });
};

export const useCreateOwnerEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ vehicleId, data }: { vehicleId: string; data: Parameters<typeof eventsApi.createOwnerEvent>[1] }) =>
      eventsApi.createOwnerEvent(vehicleId, data),
    onSuccess: (_, { vehicleId }) => {
      queryClient.invalidateQueries({
        queryKey: ['vehicles', vehicleId, 'events'],
      });
    },
  });
};
