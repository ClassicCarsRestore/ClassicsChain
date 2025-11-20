import { useState, useRef, useCallback } from 'react';
import { Upload, Trash2, AlertCircle, File, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { generateStorageUrl } from '@/lib/storage';
import { useVehicleDocuments, useUploadDocument, useDeleteDocument } from '../hooks/useVehicleDocuments';

interface VehicleDocumentsSectionProps {
  vehicleId: string;
  isOwner: boolean;
}

const MAX_DOCUMENTS = 20;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_MIME_TYPES = ['application/pdf'];

export function VehicleDocumentsSection({ vehicleId, isOwner }: VehicleDocumentsSectionProps) {
  const { t } = useTranslation('vehicle');
  const { data: documents = [], isLoading } = useVehicleDocuments(vehicleId);
  const { uploadDocument, isUploading, error: uploadError } = useUploadDocument(vehicleId);
  const deleteDocument = useDeleteDocument(vehicleId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; documentId: string | null }>({
    isOpen: false,
    documentId: null,
  });

  const validateFile = (file: File): boolean => {
    setValidationError(null);

    if (file.size > MAX_FILE_SIZE) {
      setValidationError(t('vehicle:documents.errors.fileTooLarge'));
      return false;
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setValidationError(t('vehicle:documents.errors.invalidFileType'));
      return false;
    }

    if (documents.length >= MAX_DOCUMENTS) {
      setValidationError(t('vehicle:documents.errors.maxDocumentsExceeded'));
      return false;
    }

    return true;
  };

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!validateFile(file)) {
        return;
      }

      try {
        setUploadProgress(true);
        await uploadDocument(file);
      } catch (err) {
        setValidationError(err instanceof Error ? err.message : t('vehicle:documents.errors.uploadFailed'));
      } finally {
        setUploadProgress(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [uploadDocument, documents.length, t]
  );

  const handleDeleteClick = useCallback((documentId: string) => {
    setDeleteConfirmation({ isOpen: true, documentId });
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteConfirmation.documentId) return;

    try {
      await deleteDocument.mutateAsync(deleteConfirmation.documentId);
      setDeleteConfirmation({ isOpen: false, documentId: null });
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : t('vehicle:documents.errors.deleteFailed'));
    }
  }, [deleteConfirmation.documentId, deleteDocument, t]);

  const generateDocumentUrl = (objectKey: string): string => {
    return generateStorageUrl(objectKey);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 text-xl font-semibold text-foreground">{t('vehicle:sections.documents')}</h2>
        <div className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">{t('vehicle:loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">{t('vehicle:sections.documents')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {documents.length}/{MAX_DOCUMENTS} {t('vehicle:documents.documentsCount')}
          </p>
        </div>
        {isOwner && documents.length < MAX_DOCUMENTS && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || uploadProgress}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
          >
            <Upload className="h-4 w-4" />
            {uploadProgress || isUploading ? t('vehicle:documents.uploading') : t('vehicle:documents.uploadButton')}
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading || uploadProgress}
        />
      </div>

      {/* Error messages */}
      {(validationError || uploadError) && (
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-500/50 bg-red-500/10 p-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500 mt-0.5" />
          <p className="text-sm text-red-500">{validationError || uploadError?.message || t('vehicle:documents.errors.uploadFailed')}</p>
        </div>
      )}

      {/* Documents list */}
      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted bg-muted/50 py-12">
          <File className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="font-semibold text-foreground">{t('vehicle:documents.empty.title')}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t('vehicle:documents.empty.description')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((document) => (
            <div
              key={document.id}
              className="group flex items-center justify-between rounded-lg border border-border bg-muted/50 p-4 transition-colors hover:bg-muted"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <File className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <a
                    href={generateDocumentUrl(document.objectKey)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate font-medium text-foreground transition-colors hover:text-primary"
                    title={document.filename}
                  >
                    {document.filename}
                  </a>
                  <p className="text-xs text-muted-foreground">{formatDate(document.createdAt)}</p>
                </div>
              </div>

              <div className="ml-4 flex items-center gap-2 flex-shrink-0">
                <a
                  href={generateDocumentUrl(document.objectKey)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-primary/10 p-2 text-primary transition-colors hover:bg-primary/20"
                  title={t('vehicle:documents.downloadButton')}
                >
                  <Download className="h-4 w-4" />
                </a>

                {isOwner && (
                  <button
                    onClick={() => handleDeleteClick(document.id)}
                    disabled={deleteDocument.isPending}
                    className="rounded-full bg-red-500/10 p-2 text-red-500 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                    title={t('vehicle:documents.deleteButton')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        title={t('vehicle:documents.deleteTitle')}
        message={t('vehicle:documents.deleteMessage')}
        confirmText={t('vehicle:documents.deleteConfirm')}
        cancelText={t('vehicle:documents.deleteCancel')}
        isDangerous
        isLoading={deleteDocument.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmation({ isOpen: false, documentId: null })}
      />
    </div>
  );
}
