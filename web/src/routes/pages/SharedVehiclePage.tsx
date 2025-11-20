import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { useSharedVehicle } from '@/features/vehicles/hooks/useVehicleShareLinks';
import { EventCard } from '@/components/vehicle/EventCard';
import { VehicleInfoCard } from '@/components/vehicle/VehicleInfoCard';
import { PhotoLightbox } from '@/components/vehicle/PhotoLightbox';
import { generateStorageUrl } from '@/lib/storage';

export function SharedVehiclePage() {
  const { t } = useTranslation('vehicle');
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const { data, isLoading, error } = useSharedVehicle(token!);

  // Hooks must be called at the top level, before any conditional returns
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

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
    let errorTitle = t('vehicle:shareLinks.accessDenied');
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
                <h2 className="font-semibold text-foreground mb-1">{errorTitle}</h2>
                <p className="text-sm text-muted-foreground">{errorMessage}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { vehicle, photos, documents, history } = data;
  const photoList = photos ?? [];
  const documentList = documents ?? [];
  const historyList = history ?? [];

  const handlePhotoClick = (index: number) => {
    setSelectedPhotoIndex(index);
    setIsLightboxOpen(true);
  };

  const handleNextPhoto = () => {
    setSelectedPhotoIndex((prev) => (prev + 1) % photoList.length);
  };

  const handlePreviousPhoto = () => {
    setSelectedPhotoIndex((prev) => (prev - 1 + photoList.length) % photoList.length);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <button
          onClick={() => navigate('/')}
          className="mb-6 flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('vehicle:shareLinks.backHome')}
        </button>

        {/* Vehicle Info Card */}
        <VehicleInfoCard vehicle={vehicle} />

        {/* Photos Section */}
        {photoList.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-6 mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">{t('vehicle:sections.photos')}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {photoList.map((photo, index) => (
                <div
                  key={photo.id}
                  className="rounded-lg overflow-hidden border border-border cursor-pointer transition-transform hover:scale-105"
                  onClick={() => handlePhotoClick(index)}
                >
                  <img
                    src={generateStorageUrl(photo.objectKey)}
                    alt={photo.id}
                    className="aspect-square w-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Documents Section */}
        {documentList.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-6 mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">{t('vehicle:sections.documents')}</h2>
            <div className="space-y-2">
              {documentList.map((doc) => (
                <a
                  key={doc.id}
                  href={generateStorageUrl(doc.objectKey)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{doc.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">PDF</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* History Section */}
        {historyList.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-xl font-semibold text-foreground mb-6">{t('vehicle:sections.history')}</h2>
            <div className="space-y-4">
              {historyList.map((event) => (
                <EventCard
                  key={event.id}
                  event={event as any}
                  isCertified={!!event.blockchainTxId}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty states */}
        {photoList.length === 0 && documentList.length === 0 && historyList.length === 0 && (
          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <p className="text-muted-foreground">{t('vehicle:shareLinks.noData')}</p>
          </div>
        )}

        {/* Photo Lightbox */}
        <PhotoLightbox
          isOpen={isLightboxOpen}
          photos={photoList}
          selectedIndex={selectedPhotoIndex}
          onClose={() => setIsLightboxOpen(false)}
          onNext={handleNextPhoto}
          onPrevious={handlePreviousPhoto}
        />
      </div>
    </div>
  );
}
