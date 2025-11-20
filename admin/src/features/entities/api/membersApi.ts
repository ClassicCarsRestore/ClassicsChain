import { api } from '@/lib/api';
import type { EntityMember, AddEntityMemberRequest, UpdateEntityMemberRoleRequest } from '../types/member';

export const membersApi = {
  getMembers: async (entityId: string) => {
    const response = await api.get<EntityMember[]>(`/v1/entities/${entityId}/members`);
    return response;
  },

  addMember: async (entityId: string, data: AddEntityMemberRequest) => {
    const response = await api.post<EntityMember>(`/v1/entities/${entityId}/members`, data);
    return response;
  },

  removeMember: async (entityId: string, userId: string) => {
    await api.delete(`/v1/entities/${entityId}/members/${userId}`);
  },

  updateMemberRole: async (entityId: string, userId: string, data: UpdateEntityMemberRoleRequest) => {
    const response = await api.patch<EntityMember>(`/v1/entities/${entityId}/members/${userId}`, data);
    return response;
  },
};
