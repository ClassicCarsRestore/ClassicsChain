import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Check, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { Vehicle } from '@/types/vehicle';
import type { SharedVehicle } from '@/types/shareLink';

interface VehicleInfoCardProps {
  vehicle: Vehicle | SharedVehicle;
}

export function VehicleInfoCard({ vehicle }: VehicleInfoCardProps) {
  const { t } = useTranslation('vehicle');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const isBlockchainVehicle = (v: Vehicle | SharedVehicle): v is Vehicle => {
    return 'blockchainAddress' in v && 'ipfsHash' in v;
  };

  const vehicle_ = vehicle as Vehicle;

  const hasAnyTechnicalInfo = vehicle.engineNumber || vehicle.licensePlate || vehicle.chassisNumber ||
    vehicle.transmissionNumber || vehicle.bodyType || vehicle.driveType || vehicle.gearType ||
    vehicle.suspensionType;

  return (
    <>
      <div className="rounded-lg border border-border bg-card p-6 mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          {vehicle.make} {vehicle.model}
        </h1>

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
                    <p className="mt-1 text-foreground">{vehicle.bodyType}</p>
                  </div>
                )}
                {vehicle.driveType && (
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">{t('vehicle:fields.driveType')}</p>
                    <p className="mt-1 text-foreground">{vehicle.driveType}</p>
                  </div>
                )}
                {vehicle.gearType && (
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">{t('vehicle:fields.gearType')}</p>
                    <p className="mt-1 text-foreground">{vehicle.gearType}</p>
                  </div>
                )}
                {vehicle.suspensionType && (
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">{t('vehicle:fields.suspensionType')}</p>
                    <p className="mt-1 text-foreground">{vehicle.suspensionType}</p>
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
                      <p className="mt-1 text-foreground">{vehicle.bodyType}</p>
                    </div>
                  )}
                  {vehicle.driveType && (
                    <div>
                      <p className="text-xs uppercase text-muted-foreground">{t('vehicle:fields.driveType')}</p>
                      <p className="mt-1 text-foreground">{vehicle.driveType}</p>
                    </div>
                  )}
                  {vehicle.gearType && (
                    <div>
                      <p className="text-xs uppercase text-muted-foreground">{t('vehicle:fields.gearType')}</p>
                      <p className="mt-1 text-foreground">{vehicle.gearType}</p>
                    </div>
                  )}
                  {vehicle.suspensionType && (
                    <div>
                      <p className="text-xs uppercase text-muted-foreground">{t('vehicle:fields.suspensionType')}</p>
                      <p className="mt-1 text-foreground">{vehicle.suspensionType}</p>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </div>

      {/* Blockchain/IPFS Info - Desktop: Always visible, Mobile: Collapsible */}
      {isBlockchainVehicle(vehicle) && (vehicle_.blockchainAddress || vehicle_.ipfsHash) && (
        <>
          {/* Desktop: Always visible */}
          <div className="hidden sm:block mb-8 space-y-3">
            {vehicle_.blockchainAddress && (
              <div className="flex items-start justify-between gap-2 rounded-lg border border-border bg-card p-4">
                <div className="flex-1 min-w-0">
                  <p className="text-xs uppercase text-muted-foreground mb-2">Blockchain Asset ID</p>
                  <code className="block break-all font-mono text-sm text-foreground">{vehicle_.blockchainAddress}</code>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(vehicle_.blockchainAddress!, 'blockchain-address')}
                  className="flex-shrink-0 p-2 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-foreground"
                  title="Copy to clipboard"
                >
                  {copiedField === 'blockchain-address' ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            )}
            {vehicle_.ipfsHash && (
              <div className="flex items-start justify-between gap-2 rounded-lg border border-border bg-card p-4">
                <div className="flex-1 min-w-0">
                  <p className="text-xs uppercase text-muted-foreground mb-2">IPFS Hash</p>
                  <code className="block break-all font-mono text-sm text-foreground">{vehicle_.ipfsHash}</code>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(vehicle_.ipfsHash!, 'ipfs-hash')}
                  className="flex-shrink-0 p-2 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-foreground"
                  title="Copy to clipboard"
                >
                  {copiedField === 'ipfs-hash' ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Mobile: Collapsible */}
          <Collapsible defaultOpen={false} className="sm:hidden">
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-border bg-muted/50 p-3 hover:bg-muted transition-colors mb-4">
              <span className="text-sm font-semibold text-foreground">Blockchain Information</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="mb-8 space-y-3">
              {vehicle_.blockchainAddress && (
                <div className="flex items-start justify-between gap-2 rounded-lg border border-border bg-card p-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs uppercase text-muted-foreground mb-2">Blockchain Asset ID</p>
                    <code className="block break-all font-mono text-sm text-foreground">{vehicle_.blockchainAddress}</code>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(vehicle_.blockchainAddress!, 'blockchain-address')}
                    className="flex-shrink-0 p-2 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-foreground"
                    title="Copy to clipboard"
                  >
                    {copiedField === 'blockchain-address' ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              )}
              {vehicle_.ipfsHash && (
                <div className="flex items-start justify-between gap-2 rounded-lg border border-border bg-card p-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs uppercase text-muted-foreground mb-2">IPFS Hash</p>
                    <code className="block break-all font-mono text-sm text-foreground">{vehicle_.ipfsHash}</code>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(vehicle_.ipfsHash!, 'ipfs-hash')}
                    className="flex-shrink-0 p-2 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-foreground"
                    title="Copy to clipboard"
                  >
                    {copiedField === 'ipfs-hash' ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </>
      )}
    </>
  );
}
