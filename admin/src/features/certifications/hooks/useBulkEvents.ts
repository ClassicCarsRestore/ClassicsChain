import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { EventType, EventMetadata } from '../types';

export interface VehicleIdentifier {
  chassisNumber?: string;
  licensePlate?: string;
  email?: string;
}

export interface CreateBulkEventsRequest {
  entityId: string;
  type: EventType;
  title: string;
  description?: string;
  date?: Date;
  location?: string;
  metadata: EventMetadata;
  vehicles: VehicleIdentifier[];
}

export interface BulkEventSuccess {
  vehicleId: string;
  eventId: string;
  created: boolean;
}

export interface BulkEventError {
  chassisNumber?: string;
  licensePlate?: string;
  error: string;
}

export interface CreateBulkEventsResponse {
  success: BulkEventSuccess[];
  errors: BulkEventError[];
}

export function useCreateBulkEvents() {
  return useMutation<CreateBulkEventsResponse, Error, CreateBulkEventsRequest>({
    mutationFn: async (data: CreateBulkEventsRequest) => {
      const response = await api.post<CreateBulkEventsResponse>('/v1/events/bulk', {
        entityId: data.entityId,
        type: data.type,
        title: data.title,
        description: data.description,
        date: data.date instanceof Date ? data.date.toISOString().split('T')[0] : data.date,
        location: data.location,
        metadata: data.metadata,
        vehicles: data.vehicles,
      });

      return response;
    },
  });
}
