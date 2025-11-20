import { api } from '@/lib/api';
import type { OAuth2Client, CreateOAuth2ClientDto } from '../types';

interface OAuth2ClientListResponse {
  data: OAuth2Client[];
}

interface OAuth2ClientResponse {
  data: OAuth2Client;
}

export const oauth2Api = {
  // List all OAuth2 clients for an entity
  listClients: async (entityId: string) => {
    const response = await api.get<OAuth2ClientListResponse>(
      `/v1/entities/${entityId}/oauth2/clients`
    );
    return response.data;
  },

  // Get a specific OAuth2 client
  getClient: (entityId: string, clientId: string) =>
    api.get<OAuth2ClientResponse>(
      `/v1/entities/${entityId}/oauth2/clients/${clientId}`
    ),

  // Create a new OAuth2 client
  createClient: (entityId: string, data: CreateOAuth2ClientDto) =>
    api.post<OAuth2ClientResponse>(
      `/v1/entities/${entityId}/oauth2/clients`,
      data
    ),

  // Delete an OAuth2 client
  deleteClient: (entityId: string, clientId: string) =>
    api.delete<void>(`/v1/entities/${entityId}/oauth2/clients/${clientId}`),
};
