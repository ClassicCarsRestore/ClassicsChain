import { api } from '@/lib/api';
import type { Event, CreateEventRequest, CreateOwnerEventRequest, EventListResponse } from '@/types/vehicle';

export const eventsApi = {
  getVehicleEvents: async (vehicleId: string, limit = 100) => {
    const response = await api.get<EventListResponse>(
      `/v1/vehicles/${vehicleId}/events?limit=${limit}`
    );
    return response;
  },

  getEvent: async (id: string) => {
    const response = await api.get<Event>(`/v1/events/${id}`);
    return response;
  },

  createEvent: (data: CreateEventRequest) =>
    api.post<Event>('/v1/events', data),

  createOwnerEvent: (vehicleId: string, data: CreateOwnerEventRequest) =>
    api.post<Event>(`/v1/vehicles/${vehicleId}/events`, data),
};
