import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { oauth2Api } from '../api/oauth2Api';
import type { CreateOAuth2ClientDto } from '../types';

const getClientsQueryKey = (entityId: string) =>
  ['oauth2-clients', entityId] as const;

export function useOAuth2Clients(entityId: string) {
  return useQuery({
    queryKey: getClientsQueryKey(entityId),
    queryFn: () => oauth2Api.listClients(entityId),
    enabled: !!entityId,
  });
}

export function useOAuth2Client(entityId: string, clientId: string) {
  return useQuery({
    queryKey: [...getClientsQueryKey(entityId), clientId],
    queryFn: () => oauth2Api.getClient(entityId, clientId),
    enabled: !!entityId && !!clientId,
  });
}

export function useCreateOAuth2Client() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      entityId,
      data,
    }: {
      entityId: string;
      data: CreateOAuth2ClientDto;
    }) => oauth2Api.createClient(entityId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: getClientsQueryKey(variables.entityId),
      });
    },
  });
}

export function useDeleteOAuth2Client() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      entityId,
      clientId,
    }: {
      entityId: string;
      clientId: string;
    }) => oauth2Api.deleteClient(entityId, clientId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: getClientsQueryKey(variables.entityId),
      });
    },
  });
}
