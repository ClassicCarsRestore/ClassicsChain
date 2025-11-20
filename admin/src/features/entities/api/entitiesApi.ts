import { api } from '@/lib/api';
import type { Entity, CreateEntityDto, UpdateEntityDto, EntityType } from '../types';

interface EntitiesResponse {
  data: Entity[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const entitiesApi = {
  getEntities: async (page?: number, limit?: number, type?: EntityType, certifiedBy?: string) => {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    if (type) params.append('type', type);
    if (certifiedBy) params.append('certifiedBy', certifiedBy);

    const response = await api.get<EntitiesResponse>(`/v1/entities?${params.toString()}`);
    return response;
  },

  getEntity: async (id: string) => {
    const response = await api.get<Entity>(`/v1/entities/${id}`);
    return response;
  },

  createEntity: (data: CreateEntityDto) => api.post<Entity>('/v1/entities', data),

  updateEntity: (id: string, data: UpdateEntityDto) =>
    api.put<Entity>(`/v1/entities/${id}`, data),

  deleteEntity: (id: string) => api.delete(`/v1/entities/${id}`),
};
