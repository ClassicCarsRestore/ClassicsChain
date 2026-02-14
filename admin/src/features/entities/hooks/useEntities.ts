import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { entitiesApi } from '../api/entitiesApi';
import type { CreateEntityDto, UpdateEntityDto, EntityType } from '../types';

export const useEntities = (type?: EntityType, certifiedBy?: string) => {
  return useQuery({
    queryKey: ['entities', type, certifiedBy],
    queryFn: () => entitiesApi.getEntities(undefined, undefined, type, certifiedBy),
  });
};

export const useEntity = (id: string) => {
  return useQuery({
    queryKey: ['entities', id],
    queryFn: () => entitiesApi.getEntity(id),
    enabled: !!id,
    retry: false,
  });
};

export const useCreateEntity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEntityDto) => entitiesApi.createEntity(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities'] });
    },
  });
};

export const useUpdateEntity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEntityDto }) =>
      entitiesApi.updateEntity(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities'] });
    },
  });
};

export const useUploadEntityLogo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ entityId, file }: { entityId: string; file: File }) => {
      const { uploadUrl } = await entitiesApi.generateLogoUploadUrl(entityId, file.name);
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities'] });
    },
  });
};

export const useDeleteEntityLogo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entityId: string) => entitiesApi.deleteLogo(entityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities'] });
    },
  });
};
