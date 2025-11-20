import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { VehicleFormData, Vehicle, EventType, EventMetadata } from '../types';

// Query keys
const vehicleKeys = {
  all: ['vehicles'] as const,
  detail: (vehicleId: string) => [...vehicleKeys.all, 'detail', vehicleId] as const,
};

const eventKeys = {
  all: ['events'] as const,
  byVehicle: (vehicleId: string) => [...eventKeys.all, 'byVehicle', vehicleId] as const,
};

/**
 * Fetch all vehicles
 */
export function useVehicles(refreshTrigger?: number) {
  return useQuery({
    queryKey: [vehicleKeys.all, refreshTrigger],
    queryFn: async () => {
      const response = await api.get<{ data: Vehicle[] }>('/v1/vehicles');
      return response.data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Create a new vehicle (orphaned)
 */
export function useCreateVehicles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      vehicleData,
    }: {
      vehicleData: VehicleFormData;
      entityId: string;
    }) => {
      const response = await api.post<Vehicle>('/v1/certifiers/vehicles', {
        licensePlate: vehicleData.licensePlate || null,
        chassisNumber: vehicleData.chassisNumber || null,
        make: vehicleData.make,
        model: vehicleData.model,
        year: vehicleData.year,
        color: vehicleData.color || null,
        engineNumber: vehicleData.engineNumber || null,
        transmissionNumber: vehicleData.transmissionNumber || null,
        bodyType: vehicleData.bodyType || null,
        driveType: vehicleData.driveType || null,
        gearType: vehicleData.gearType || null,
        suspensionType: vehicleData.suspensionType || null,
      });

      return response;
    },
    onSuccess: () => {
      // Invalidate the vehicles list
      queryClient.invalidateQueries({
        queryKey: vehicleKeys.all,
      });
    },
  });
}

/**
 * Create an event (certification or event certificate) for a vehicle
 */
export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      vehicleId,
      entityId,
      title,
      description,
      type,
      date,
      location,
      metadata,
    }: {
      vehicleId: string;
      entityId: string;
      title: string;
      description?: string;
      type: EventType;
      date?: Date;
      location?: string;
      metadata: EventMetadata;
    }) => {
      const response = await api.post('/v1/events', {
        vehicleId,
        entityId,
        title,
        description,
        type,
        date,
        location,
        metadata,
      });

      return response;
    },
    onSuccess: (_, { vehicleId }) => {
      // Invalidate events for this vehicle
      queryClient.invalidateQueries({
        queryKey: eventKeys.byVehicle(vehicleId),
      });
    },
  });
}

/**
 * Fetch vehicle details
 */
export function useVehicleDetail(vehicleId: string) {
  return useQuery({
    queryKey: vehicleKeys.detail(vehicleId),
    queryFn: async () => {
      const response = await api.get<Vehicle>(`/v1/vehicles/${vehicleId}`);
      return response;
    },
    enabled: !!vehicleId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Fetch events for a vehicle
 */
export function useVehicleEvents(vehicleId: string) {
  return useQuery({
    queryKey: eventKeys.byVehicle(vehicleId),
    queryFn: async () => {
      const response = await api.get<{ data: any[] }>(`/v1/vehicles/${vehicleId}/events`);
      return response.data || [];
    },
    enabled: !!vehicleId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
