import { api } from '@/lib/api';
import type { User, CreateUserDto } from '../types';

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

  createUser: (data: CreateUserDto) => api.post<User>('/v1/admin/users', data),
};
