import { api } from '@/lib/api';
import type { User, CreateUserDto, UpdateUserDto } from '../types';

interface UsersResponse {
  data: User[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const usersApi = {
  getUsers: async () => {
    const response = await api.get<UsersResponse>('/v1/admin/users');
    return response.data;
  },

  getUser: (id: string) => api.get<User>(`/v1/admin/users/${id}`),

  createUser: (data: CreateUserDto) => api.post<User>('/v1/admin/users', data),

  updateUser: (id: string, data: UpdateUserDto) =>
    api.patch<User>(`/v1/admin/users/${id}`, data),

  deleteUser: (id: string) => api.delete<void>(`/v1/admin/users/${id}`),
};
