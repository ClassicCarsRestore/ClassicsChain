import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { useSharedVehicle } from '@/features/vehicles/hooks/useVehicleShareLinks';
import { VehiclePassport } from '@/components/vehicle/VehiclePassport';

export function SharedVehiclePage() {
  const { t } = useTranslation('vehicle');
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const { data, isLoading, error } = useSharedVehicle(token!);

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

  const { vehicle, photos, documents, history } = data;

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

        <VehiclePassport
          vehicle={vehicle}
          photos={photos}
          documents={documents}
          events={history}
          showPhotos={!!photos && photos.length > 0}
          showDocuments={!!documents && documents.length > 0}
          showHistory={!!history && history.length > 0}
        />
      </div>
    </div>
  );
}
