import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { useVehiclePassport } from '@/features/vehicles/hooks/useVehiclePassport';
import { VehiclePassport } from '@/components/vehicle/VehiclePassport';

export function PassportPage() {
  const { vehicleId } = useParams<{ vehicleId: string }>();

  if (!vehicleId) {
    return <NotFoundView />;
  }

  return <PassportView vehicleId={vehicleId} />;
}

function PassportView({ vehicleId }: { vehicleId: string }) {
  const { t } = useTranslation('vehicle');
  const { data, isLoading, error } = useVehiclePassport(vehicleId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-3xl px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-3xl px-4 py-8">
          <BackButton />
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 flex-shrink-0 text-red-500 mt-1" />
              <div>
                <h2 className="font-semibold text-foreground mb-1">
                  {t('passport.notFound')}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t('passport.notFoundDescription')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { vehicle, photos, history } = data;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <BackButton />
        <VehiclePassport
          vehicle={vehicle}
          photos={photos}
          events={history}
          showPhotos={(photos?.length ?? 0) > 0}
          showDocuments={false}
          showHistory={(history?.length ?? 0) > 0}
        />
      </div>
    </div>
  );
}

function BackButton() {
  const { t } = useTranslation('vehicle');
  const navigate = useNavigate();

  return (
    <div className="mb-6">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('passport.backHome')}
      </button>
    </div>
  );
}

function NotFoundView() {
  const { t } = useTranslation('vehicle');

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <BackButton />
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="h-6 w-6 flex-shrink-0 text-red-500 mt-1" />
            <div>
              <h2 className="font-semibold text-foreground mb-1">
                {t('passport.notFound')}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t('passport.notFoundDescription')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
