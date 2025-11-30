import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import {
  getVehicleDocuments,
  generateDocumentUploadUrl,
  confirmDocumentUpload,
  deleteVehicleDocument,
} from '../api/documentsApi';
import type { Document } from '../types/document';

const DOCUMENTS_QUERY_KEY = (vehicleId: string) => ['documents', vehicleId];

export function useVehicleDocuments(vehicleId: string) {
  return useQuery({
    queryKey: DOCUMENTS_QUERY_KEY(vehicleId),
    queryFn: () => getVehicleDocuments(vehicleId),
  });
}

export function useUploadDocument(vehicleId: string) {
  const queryClient = useQueryClient();

  const generateUrlMutation = useMutation({
    mutationFn: (filename: string) => generateDocumentUploadUrl(vehicleId, filename),
  });

  const confirmUploadMutation = useMutation({
    mutationFn: (documentId: string) => confirmDocumentUpload(vehicleId, documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY(vehicleId) });
    },
  });

  const uploadDocument = useCallback(
    async (file: File): Promise<Document> => {
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
        throw new Error(`Failed to upload document: ${uploadFileResponse.statusText}`);
      }

      const confirmedDocument = await confirmUploadMutation.mutateAsync(response.documentId);

      return confirmedDocument;
    },
    [generateUrlMutation, confirmUploadMutation]
  );

  return {
    uploadDocument,
    isUploading:
      generateUrlMutation.isPending || confirmUploadMutation.isPending,
    error: generateUrlMutation.error || confirmUploadMutation.error,
  };
}

export function useDeleteDocument(vehicleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: string) => deleteVehicleDocument(vehicleId, documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY(vehicleId) });
    },
  });
}
