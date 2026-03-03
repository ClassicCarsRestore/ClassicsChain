import { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  AlertCircle,
  Loader2,
  Clock,
  FileText,
  Camera,
  Eye,
  File,
  Download,
} from 'lucide-react';
import { useSharedVehicle } from '@/features/vehicles/hooks/useVehicleShareLinks';
import { VehicleInfoCard } from '@/components/vehicle/VehicleInfoCard';
import { VehicleStats } from '@/components/vehicle/VehicleStats';
import { EventTimeline } from '@/components/vehicle/EventTimeline';
import { PhotoLightbox } from '@/components/vehicle/PhotoLightbox';
import { generateStorageUrl } from '@/lib/storage';
import type { Event } from '@/types/vehicle';

export function SharedVehiclePage() {
  const { t } = useTranslation('vehicle');
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const { data, isLoading, error } = useSharedVehicle(token!);

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  const handlePhotoClick = useCallback((index: number) => {
    setSelectedPhotoIndex(index);
    setIsLightboxOpen(true);
  }, []);

  const photos = data?.photos ?? [];
  const documents = data?.documents;
  const history = data?.history;

  const handleNextPhoto = useCallback(() => {
    setSelectedPhotoIndex((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  const handlePreviousPhoto = useCallback(() => {
    setSelectedPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  const sortedEvents = useMemo(() => {
    if (!history) return [];
    return [...history].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [history]);

  const vehicleStats = useMemo(() => {
    const anchoredEvents = sortedEvents.filter(e => !!e.blockchainTxId).length;
    const earliestEvent = sortedEvents.length > 0
      ? sortedEvents.reduce((earliest, event) =>
          new Date(event.date) < new Date(earliest.date) ? event : earliest
        )
      : null;

    return {
      totalEvents: sortedEvents.length,
      anchoredEvents,
      photosCount: photos.length,
      documentsCount: documents?.length || 0,
      earliestEventDate: earliestEvent?.date,
      hasVerifiedEvents: anchoredEvents > 0,
    };
  }, [sortedEvents, photos, documents]);

  if (!token) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <p className="text-foreground font-semibold">{t('vehicle:shareLinks.invalidToken')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    let errorMessage = t('vehicle:shareLinks.errors.loadFailed');

    if (error) {
      const errorStr = error.toString().toLowerCase();

      if (errorStr.includes('expired') || errorStr.includes('revoked')) {
        errorMessage = t('vehicle:shareLinks.errors.linkExpired');
      } else if (errorStr.includes('not found') || error.message?.includes('404')) {
        errorMessage = t('vehicle:shareLinks.errors.linkNotFound');
      } else if (error.message) {
        errorMessage = error.message;
      }
    }

    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <button
            onClick={() => navigate('/')}
            className="mb-6 flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('vehicle:shareLinks.backHome')}
          </button>

          <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 flex-shrink-0 text-red-500 mt-1" />
              <div>
                <h2 className="font-semibold text-foreground mb-1">{t('vehicle:shareLinks.accessDenied')}</h2>
                <p className="text-sm text-muted-foreground">{errorMessage}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { vehicle } = data;

  const isCertified = (event: Event) => !!event.entityId;

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Back button */}
        <div className="mb-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('vehicle:shareLinks.backHome')}
          </button>
        </div>

        {/* Vehicle Info Card */}
        <VehicleInfoCard vehicle={vehicle} hasVerifiedEvents={vehicleStats.hasVerifiedEvents} />

        {/* Quick Stats */}
        <VehicleStats
          totalEvents={vehicleStats.totalEvents}
          anchoredEvents={vehicleStats.anchoredEvents}
          photosCount={vehicleStats.photosCount}
          documentsCount={vehicleStats.documentsCount}
          earliestEventDate={vehicleStats.earliestEventDate}
        />

        {/* Photos Section */}
        {photos.length > 0 && (
          <div className="mb-8 rounded-lg border border-border bg-card p-6">
            <div className="mb-6">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">
                <Camera className="h-5 w-5 text-primary" />
                {t('vehicle:sections.photos')}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {photos.length} {t('vehicle:photos.photosCount')}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {photos.map((photo, index) => (
                <div
                  key={photo.id}
                  onClick={() => handlePhotoClick(index)}
                  className="group relative overflow-hidden rounded-lg border border-border bg-muted aspect-square cursor-pointer"
                >
                  <img
                    src={generateStorageUrl(photo.objectKey)}
                    alt={`Photo ${index + 1}`}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="rounded-full bg-blue-500 p-2 text-white">
                      <Eye className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <PhotoLightbox
              isOpen={isLightboxOpen}
              photos={photos}
              selectedIndex={selectedPhotoIndex}
              onClose={() => setIsLightboxOpen(false)}
              onNext={handleNextPhoto}
              onPrevious={handlePreviousPhoto}
            />
          </div>
        )}

        {/* Documents Section */}
        {documents && documents.length > 0 && (
          <div className="mb-8 rounded-lg border border-border bg-card p-6">
            <div className="mb-6">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">
                <FileText className="h-5 w-5 text-primary" />
                {t('vehicle:sections.documents')}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {documents.length} {t('vehicle:documents.documentsCount')}
              </p>
            </div>

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
                        href={generateStorageUrl(document.objectKey)}
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

                  <div className="ml-4 flex-shrink-0">
                    <a
                      href={generateStorageUrl(document.objectKey)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full bg-primary/10 p-2 text-primary transition-colors hover:bg-primary/20 inline-flex"
                      title={t('vehicle:documents.downloadButton')}
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Events/History Section */}
        {sortedEvents.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="mb-6">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">
                <Clock className="h-5 w-5 text-primary" />
                {t('vehicle:sections.history')}
              </h2>
            </div>

            <EventTimeline events={sortedEvents} isCertified={isCertified} />
          </div>
        )}
      </div>
    </div>
  );
}
