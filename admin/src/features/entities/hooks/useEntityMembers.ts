import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membersApi } from '../api/membersApi';
import type { AddEntityMemberRequest, UpdateEntityMemberRoleRequest } from '../types/member';

export function useEntityMembers(entityId: string) {
  return useQuery({
    queryKey: ['entityMembers', entityId],
    queryFn: () => membersApi.getMembers(entityId),
    enabled: !!entityId,
  });
}

export function useAddEntityMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ entityId, data }: { entityId: string; data: AddEntityMemberRequest }) =>
      membersApi.addMember(entityId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['entityMembers', variables.entityId] });
    },
  });
}

export function useRemoveEntityMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ entityId, userId }: { entityId: string; userId: string }) =>
      membersApi.removeMember(entityId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['entityMembers', variables.entityId] });
    },
  });
}

export function useUpdateEntityMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      entityId,
      userId,
      data,
    }: {
      entityId: string;
      userId: string;
      data: UpdateEntityMemberRoleRequest;
    }) => membersApi.updateMemberRole(entityId, userId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['entityMembers', variables.entityId] });
    },
  });
}
