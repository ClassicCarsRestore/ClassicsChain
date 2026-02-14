import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { VerificationBadge } from './VerificationBadge';
import { VehicleVerificationDialog } from './VehicleVerificationDialog';
import { BrandLogo } from './BrandLogo';
import type { Vehicle } from '@/types/vehicle';
import type { SharedVehicle } from '@/types/shareLink';

interface VehicleInfoCardProps {
  vehicle: Vehicle | SharedVehicle;
  hasVerifiedEvents?: boolean;
}

export function VehicleInfoCard({ vehicle, hasVerifiedEvents = false }: VehicleInfoCardProps) {
  const { t } = useTranslation(['vehicle', 'dashboard']);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);

  const isBlockchainVehicle = (v: Vehicle | SharedVehicle): v is Vehicle => {
    return 'blockchainAssetId' in v;
  };

  const vehicle_ = vehicle as Vehicle;
  const network = import.meta.env.VITE_ALGORAND_NETWORK || 'testnet';
  const hasBlockchainData = isBlockchainVehicle(vehicle) && vehicle_.blockchainAssetId;

  const hasAnyTechnicalInfo = vehicle.engineNumber || vehicle.licensePlate || vehicle.chassisNumber ||
    vehicle.transmissionNumber || vehicle.bodyType || vehicle.driveType || vehicle.gearType ||
    vehicle.suspensionType;

  return (
    <>
      <div className="rounded-lg border border-border bg-card p-6 mb-8">
        <div className="flex items-center gap-3 flex-wrap">
          <BrandLogo make={vehicle.make} size="md" />
          <h1 className="text-3xl font-bold text-foreground">
            {vehicle.make} {vehicle.model}
          </h1>
          <VerificationBadge
            isVerified={hasVerifiedEvents || !!hasBlockchainData}
            onClick={hasBlockchainData ? () => setShowVerificationDialog(true) : undefined}
          />
        </div>

        {/* Basic Information - Always Visible */}
        <div className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-xs uppercase text-muted-foreground">{t('vehicle:fields.year')}</p>
              <p className="mt-1 text-lg font-semibold text-foreground">{vehicle.year}</p>
            </div>
            {vehicle.color && (
              <div>
                <p className="text-xs uppercase text-muted-foreground">{t('vehicle:fields.color')}</p>
                <p className="mt-1 text-foreground">{vehicle.color}</p>
              </div>
            )}
            {vehicle.licensePlate && (
              <div>
                <p className="text-xs uppercase text-muted-foreground">{t('vehicle:fields.licensePlate')}</p>
                <p className="mt-1 truncate font-mono text-sm text-foreground">{vehicle.licensePlate}</p>
              </div>
            )}
          </div>

          {/* Desktop: Always visible Technical Details */}
          {hasAnyTechnicalInfo && (
            <div className="hidden sm:block">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {vehicle.engineNumber && (
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">{t('vehicle:fields.engineNumber')}</p>
                    <p className="mt-1 truncate font-mono text-sm text-foreground">{vehicle.engineNumber}</p>
                  </div>
                )}
                {vehicle.chassisNumber && (
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">{t('vehicle:fields.chassisNumber')}</p>
                    <p className="mt-1 truncate font-mono text-sm text-foreground">{vehicle.chassisNumber}</p>
                  </div>
                )}
                {vehicle.transmissionNumber && (
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">{t('vehicle:fields.transmissionNumber')}</p>
                    <p className="mt-1 truncate font-mono text-sm text-foreground">{vehicle.transmissionNumber}</p>
                  </div>
                )}
                {vehicle.bodyType && (
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">{t('vehicle:fields.bodyType')}</p>
                    <p className="mt-1 text-foreground">{t(`dashboard:vehicleForm.bodyTypes.${vehicle.bodyType}`, { defaultValue: vehicle.bodyType })}</p>
                  </div>
                )}
                {vehicle.driveType && (
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">{t('vehicle:fields.driveType')}</p>
                    <p className="mt-1 text-foreground">{t(`dashboard:vehicleForm.driveTypes.${vehicle.driveType}`, { defaultValue: vehicle.driveType })}</p>
                  </div>
                )}
                {vehicle.gearType && (
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">{t('vehicle:fields.gearType')}</p>
                    <p className="mt-1 text-foreground">{t(`dashboard:vehicleForm.gearTypes.${vehicle.gearType}`, { defaultValue: vehicle.gearType })}</p>
                  </div>
                )}
                {vehicle.suspensionType && (
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">{t('vehicle:fields.suspensionType')}</p>
                    <p className="mt-1 text-foreground">{t(`dashboard:vehicleForm.suspensionTypes.${vehicle.suspensionType}`, { defaultValue: vehicle.suspensionType })}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mobile: Collapsible Technical Details */}
          {hasAnyTechnicalInfo && (
            <Collapsible defaultOpen={false} className="sm:hidden">
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-border bg-muted/50 p-3 hover:bg-muted transition-colors">
                <span className="text-sm font-semibold text-foreground">Technical Details</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 space-y-4">
                <div className="grid gap-4 grid-cols-2">
                  {vehicle.engineNumber && (
                    <div>
                      <p className="text-xs uppercase text-muted-foreground">{t('vehicle:fields.engineNumber')}</p>
                      <p className="mt-1 truncate font-mono text-sm text-foreground">{vehicle.engineNumber}</p>
                    </div>
                  )}
                  {vehicle.chassisNumber && (
                    <div>
                      <p className="text-xs uppercase text-muted-foreground">{t('vehicle:fields.chassisNumber')}</p>
                      <p className="mt-1 truncate font-mono text-sm text-foreground">{vehicle.chassisNumber}</p>
                    </div>
                  )}
                  {vehicle.transmissionNumber && (
                    <div>
                      <p className="text-xs uppercase text-muted-foreground">{t('vehicle:fields.transmissionNumber')}</p>
                      <p className="mt-1 truncate font-mono text-sm text-foreground">{vehicle.transmissionNumber}</p>
                    </div>
                  )}
                  {vehicle.bodyType && (
                    <div>
                      <p className="text-xs uppercase text-muted-foreground">{t('vehicle:fields.bodyType')}</p>
                      <p className="mt-1 text-foreground">{t(`dashboard:vehicleForm.bodyTypes.${vehicle.bodyType}`, { defaultValue: vehicle.bodyType })}</p>
                    </div>
                  )}
                  {vehicle.driveType && (
                    <div>
                      <p className="text-xs uppercase text-muted-foreground">{t('vehicle:fields.driveType')}</p>
                      <p className="mt-1 text-foreground">{t(`dashboard:vehicleForm.driveTypes.${vehicle.driveType}`, { defaultValue: vehicle.driveType })}</p>
                    </div>
                  )}
                  {vehicle.gearType && (
                    <div>
                      <p className="text-xs uppercase text-muted-foreground">{t('vehicle:fields.gearType')}</p>
                      <p className="mt-1 text-foreground">{t(`dashboard:vehicleForm.gearTypes.${vehicle.gearType}`, { defaultValue: vehicle.gearType })}</p>
                    </div>
                  )}
                  {vehicle.suspensionType && (
                    <div>
                      <p className="text-xs uppercase text-muted-foreground">{t('vehicle:fields.suspensionType')}</p>
                      <p className="mt-1 text-foreground">{t(`dashboard:vehicleForm.suspensionTypes.${vehicle.suspensionType}`, { defaultValue: vehicle.suspensionType })}</p>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </div>

      {hasBlockchainData && (
        <VehicleVerificationDialog
          open={showVerificationDialog}
          onOpenChange={setShowVerificationDialog}
          data={{
            vehicleName: `${vehicle.make} ${vehicle.model}`,
            blockchainAssetId: vehicle_.blockchainAssetId!,
            cid: vehicle_.cid,
            cidSourceJson: vehicle_.cidSourceJson,
            cidSourceCbor: vehicle_.cidSourceCbor,
            network,
          }}
        />
      )}
    </>
  );
}
