import { useState, useRef, useCallback } from 'react';
import { Upload, Trash2, AlertCircle, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PhotoLightbox } from '@/components/vehicle/PhotoLightbox';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { generateStorageUrl } from '@/lib/storage';
import { useVehiclePhotos, useUploadPhoto, useDeletePhoto } from '../hooks/useVehiclePhotos';

interface VehiclePhotosSectionProps {
  vehicleId: string;
  isOwner: boolean;
}

const MAX_PHOTOS = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function VehiclePhotosSection({ vehicleId, isOwner }: VehiclePhotosSectionProps) {
  const { t } = useTranslation('vehicle');
  const { data: photos = [], isLoading } = useVehiclePhotos(vehicleId);
  const { uploadPhoto, isUploading, error: uploadError } = useUploadPhoto(vehicleId);
  const deletePhoto = useDeletePhoto(vehicleId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; photoId: string | null }>({
    isOpen: false,
    photoId: null,
  });

  const validateFile = (file: File): boolean => {
    setValidationError(null);

    if (file.size > MAX_FILE_SIZE) {
      setValidationError(t('vehicle:photos.errors.fileTooLarge'));
      return false;
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setValidationError(t('vehicle:photos.errors.invalidFileType'));
      return false;
    }

    if (photos.length >= MAX_PHOTOS) {
      setValidationError(t('vehicle:photos.errors.maxPhotosExceeded'));
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
        await uploadPhoto(file);
      } catch (err) {
        setValidationError(err instanceof Error ? err.message : t('vehicle:photos.errors.uploadFailed'));
      } finally {
        setUploadProgress(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [uploadPhoto, photos.length, t]
  );

  const handleDeleteClick = useCallback((photoId: string) => {
    setDeleteConfirmation({ isOpen: true, photoId });
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteConfirmation.photoId) return;

    try {
      await deletePhoto.mutateAsync(deleteConfirmation.photoId);
      setDeleteConfirmation({ isOpen: false, photoId: null });
      setActivePhotoId(null);
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : t('vehicle:photos.errors.deleteFailed'));
    }
  }, [deleteConfirmation.photoId, deletePhoto, t]);

  const handlePhotoContainerClick = useCallback((photoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Only show overlay on touch devices/mobile (when window.innerWidth <= 640px)
    if (window.innerWidth <= 640) {
      setActivePhotoId(activePhotoId === photoId ? null : photoId);
    }
  }, [activePhotoId]);

  const handlePhotoClick = useCallback((index: number) => {
    setSelectedPhotoIndex(index);
    setIsLightboxOpen(true);
    setActivePhotoId(null);
  }, []);

  const handleNextPhoto = useCallback(() => {
    setSelectedPhotoIndex((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  const handlePreviousPhoto = useCallback(() => {
    setSelectedPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 text-xl font-semibold text-foreground">{t('vehicle:sections.photos')}</h2>
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
          <h2 className="text-xl font-semibold text-foreground">{t('vehicle:sections.photos')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {photos.length}/{MAX_PHOTOS} {t('vehicle:photos.photosCount')}
          </p>
        </div>
        {isOwner && photos.length < MAX_PHOTOS && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || uploadProgress}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
          >
            <Upload className="h-4 w-4" />
            {uploadProgress || isUploading ? t('vehicle:photos.uploading') : t('vehicle:photos.uploadButton')}
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading || uploadProgress}
        />
      </div>

      {/* Error messages */}
      {(validationError || uploadError) && (
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-500/50 bg-red-500/10 p-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500 mt-0.5" />
          <p className="text-sm text-red-500">{validationError || uploadError?.message || t('vehicle:photos.errors.uploadFailed')}</p>
        </div>
      )}

      {/* Photos grid */}
      {photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted bg-muted/50 py-12">
          <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="font-semibold text-foreground">{t('vehicle:photos.empty.title')}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t('vehicle:photos.empty.description')}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              onClick={(e) => handlePhotoContainerClick(photo.id, e)}
              className="group relative overflow-hidden rounded-lg border border-border bg-muted aspect-square cursor-pointer"
            >
              {/* Image */}
              <img
                src={generateStorageUrl(photo.objectKey)}
                alt={photo.objectKey}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />

              {/* Overlay with buttons */}
              <div
                onClick={(e) => e.stopPropagation()}
                className={`absolute inset-0 flex items-center justify-center gap-3 bg-black/50 transition-opacity group-hover:opacity-100 group-hover:pointer-events-auto ${
                  activePhotoId === photo.id ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePhotoClick(index);
                  }}
                  className="rounded-full bg-blue-500 p-2 text-white transition-colors hover:bg-blue-600 cursor-pointer pointer-events-auto"
                  title={t('vehicle:photos.viewButton') || 'View photo'}
                >
                  <Eye className="h-5 w-5" />
                </button>
                {isOwner && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(photo.id);
                    }}
                    disabled={deletePhoto.isPending}
                    className="rounded-full bg-red-500 p-2 text-white transition-colors hover:bg-red-600 disabled:opacity-50 cursor-pointer pointer-events-auto"
                    title={t('vehicle:photos.deleteButton')}
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Photo Lightbox */}
      <PhotoLightbox
        isOpen={isLightboxOpen}
        photos={photos}
        selectedIndex={selectedPhotoIndex}
        onClose={() => setIsLightboxOpen(false)}
        onNext={handleNextPhoto}
        onPrevious={handlePreviousPhoto}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        title={t('vehicle:photos.deleteTitle')}
        message={t('vehicle:photos.deleteMessage')}
        confirmText={t('vehicle:photos.deleteConfirm')}
        cancelText={t('vehicle:photos.deleteCancel')}
        isDangerous
        isLoading={deletePhoto.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmation({ isOpen: false, photoId: null })}
      />
    </div>
  );
}
