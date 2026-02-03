import { useState, useRef, useCallback } from 'react';
import { Upload, X, AlertCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  createUploadSession,
  generateUploadUrl,
  confirmUpload,
  deleteImage,
  type EventImage,
} from '../api/eventImagesApi';
import { generateStorageUrl } from '@/lib/storage';

interface EventImageUploaderProps {
  sessionId: string | null;
  onSessionCreated: (sessionId: string) => void;
  images: EventImage[];
  onImagesChange: (images: EventImage[]) => void;
  disabled?: boolean;
}

const MAX_IMAGES = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function EventImageUploader({
  sessionId,
  onSessionCreated,
  images,
  onImagesChange,
  disabled = false,
}: EventImageUploaderProps) {
  const { t } = useTranslation('vehicles');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, { name: string; progress: number }>>(new Map());

  const validateFile = (file: File): boolean => {
    if (file.size > MAX_FILE_SIZE) {
      setError(t('eventImages.errors.fileTooLarge', 'File too large (max 10MB)'));
      return false;
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setError(t('eventImages.errors.invalidFileType', 'Invalid file type. Use JPEG, PNG, or WebP'));
      return false;
    }

    if (images.length >= MAX_IMAGES) {
      setError(t('eventImages.errors.maxImagesExceeded', 'Maximum number of images reached (10)'));
      return false;
    }

    return true;
  };

  const ensureSession = async (): Promise<string> => {
    if (sessionId) return sessionId;

    const response = await createUploadSession();
    onSessionCreated(response.sessionId);
    return response.sessionId;
  };

  const uploadFile = async (file: File): Promise<void> => {
    const uploadId = crypto.randomUUID();
    setUploadingFiles((prev) => new Map(prev).set(uploadId, { name: file.name, progress: 0 }));

    try {
      const currentSessionId = await ensureSession();

      setUploadingFiles((prev) => {
        const updated = new Map(prev);
        updated.set(uploadId, { name: file.name, progress: 20 });
        return updated;
      });

      const { imageId, uploadUrl } = await generateUploadUrl(currentSessionId, file.name);

      setUploadingFiles((prev) => {
        const updated = new Map(prev);
        updated.set(uploadId, { name: file.name, progress: 40 });
        return updated;
      });

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to storage');
      }

      setUploadingFiles((prev) => {
        const updated = new Map(prev);
        updated.set(uploadId, { name: file.name, progress: 80 });
        return updated;
      });

      const confirmedImage = await confirmUpload(imageId);

      onImagesChange([...images, confirmedImage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingFiles((prev) => {
        const updated = new Map(prev);
        updated.delete(uploadId);
        return updated;
      });
    }
  };

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      setError(null);
      const files = Array.from(event.target.files || []);

      if (files.length === 0) return;

      const remainingSlots = MAX_IMAGES - images.length;
      const filesToUpload = files.slice(0, remainingSlots);

      for (const file of filesToUpload) {
        if (validateFile(file)) {
          await uploadFile(file);
        }
      }

      if (files.length > remainingSlots) {
        setError(t('eventImages.errors.someFilesSkipped', `Only ${remainingSlots} file(s) uploaded (max 10 total)`));
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [images, t]
  );

  const handleRemoveImage = async (imageId: string) => {
    try {
      await deleteImage(imageId);
      onImagesChange(images.filter((img) => img.id !== imageId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove image');
    }
  };

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if (disabled) return;

      setError(null);
      const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));

      const remainingSlots = MAX_IMAGES - images.length;
      const filesToUpload = files.slice(0, remainingSlots);

      for (const file of filesToUpload) {
        if (validateFile(file)) {
          await uploadFile(file);
        }
      }
    },
    [images, disabled]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const isUploading = uploadingFiles.size > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium">
          {t('eventImages.title', 'Event Images')}
        </label>
        <span className="text-xs text-muted-foreground">
          {images.length}/{MAX_IMAGES}
        </span>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-500/50 bg-red-500/10 p-3">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500 mt-0.5" />
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {/* Image previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((image) => (
            <div
              key={image.id}
              className="relative aspect-square rounded-md border border-border overflow-hidden group"
            >
              <img
                src={generateStorageUrl(image.objectKey)}
                alt=""
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(image.id)}
                disabled={disabled}
                className="absolute top-1 right-1 p-1 bg-red-500/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:opacity-50"
              >
                <X className="h-3 w-3" />
              </button>
              {image.cid && (
                <div className="absolute bottom-0 left-0 right-0 bg-green-500/80 text-white text-[10px] text-center py-0.5">
                  CID verified
                </div>
              )}
            </div>
          ))}

          {/* Upload placeholders for uploading files */}
          {Array.from(uploadingFiles.entries()).map(([id, { progress }]) => (
            <div
              key={id}
              className="relative aspect-square rounded-md border border-border overflow-hidden bg-muted flex items-center justify-center"
            >
              <div className="flex flex-col items-center gap-1">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">{progress}%</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {images.length < MAX_IMAGES && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-6 transition-colors cursor-pointer ${
            disabled || isUploading
              ? 'border-muted bg-muted/30 cursor-not-allowed'
              : 'border-muted hover:border-primary/50 hover:bg-muted/50'
          }`}
        >
          <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {isUploading
              ? t('eventImages.uploading', 'Uploading...')
              : t('eventImages.dropzone', 'Click or drag images here')}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t('eventImages.formats', 'JPEG, PNG, WebP (max 10MB each)')}
          </p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      <p className="text-xs text-muted-foreground">
        {t('eventImages.help', 'Images will be included in the blockchain-anchored event data. CIDs are computed on upload.')}
      </p>
    </div>
  );
}
