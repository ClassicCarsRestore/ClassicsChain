import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import {
  getVehiclePhotos,
  generatePhotoUploadUrl,
  confirmPhotoUpload,
  deleteVehiclePhoto,
} from '../api/photosApi';
import type { Photo } from '../types/photo';

const PHOTOS_QUERY_KEY = (vehicleId: string) => ['photos', vehicleId];

export function useVehiclePhotos(vehicleId: string) {
  return useQuery({
    queryKey: PHOTOS_QUERY_KEY(vehicleId),
    queryFn: () => getVehiclePhotos(vehicleId),
  });
}

export function useUploadPhoto(vehicleId: string) {
  const queryClient = useQueryClient();

  const generateUrlMutation = useMutation({
    mutationFn: (filename: string) => generatePhotoUploadUrl(vehicleId, filename),
  });

  const confirmUploadMutation = useMutation({
    mutationFn: (photoId: string) => confirmPhotoUpload(vehicleId, photoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PHOTOS_QUERY_KEY(vehicleId) });
    },
  });

  const uploadPhoto = useCallback(
    async (file: File): Promise<Photo> => {
      const response = await generateUrlMutation.mutateAsync(file.name);

      if (!response.uploadUrl) {
        throw new Error('No upload URL received from server');
      }

      const uploadFileResponse = await fetch(response.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadFileResponse.ok) {
        throw new Error(`Failed to upload photo: ${uploadFileResponse.statusText}`);
      }

      const confirmedPhoto = await confirmUploadMutation.mutateAsync(response.photoId);

      return confirmedPhoto;
    },
    [generateUrlMutation, confirmUploadMutation]
  );

  return {
    uploadPhoto,
    isUploading:
      generateUrlMutation.isPending || confirmUploadMutation.isPending,
    error: generateUrlMutation.error || confirmUploadMutation.error,
  };
}

export function useDeletePhoto(vehicleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (photoId: string) => deleteVehiclePhoto(vehicleId, photoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PHOTOS_QUERY_KEY(vehicleId) });
    },
  });
}
