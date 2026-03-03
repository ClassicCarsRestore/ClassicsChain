import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  AlertCircle,
  Loader2,
  ShieldCheck,
  ShieldX,
  ExternalLink,
  Clock,
  BookOpen,
  Award,
} from 'lucide-react';
import { useVehicleVerification } from '@/features/vehicles/hooks/useVehicleVerification';
import type { VehicleVerificationResponse, VerificationEvent } from '@/types/verification';

export function VerificationPage() {
  const { vehicleId } = useParams<{ vehicleId: string }>();

  if (!vehicleId) {
    return <NotFoundView />;
  }

  return <VehicleVerificationView vehicleId={vehicleId} />;
}

function VehicleVerificationView({ vehicleId }: { vehicleId: string }) {
  const { t } = useTranslation('vehicle');
  const { data, isLoading, error } = useVehicleVerification(vehicleId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-4xl px-4 py-8">
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
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <BackButton />
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 flex-shrink-0 text-red-500 mt-1" />
              <div>
                <h2 className="font-semibold text-foreground mb-1">
                  {t('publicVerification.notFound')}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t('publicVerification.notFoundDescription')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <BackButton />
        <VerificationContent data={data} />
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
        {t('publicVerification.backHome')}
      </button>
    </div>
  );
}

function VerificationContent({ data }: { data: VehicleVerificationResponse }) {
  const { t } = useTranslation('vehicle');

  const explorerUrl = data.blockchainAssetId
    ? `https://lora.algokit.io/${data.algorandNetwork}/asset/${data.blockchainAssetId}`
    : null;
  const cidInspectorUrl = data.vehicleCid
    ? `https://cid.ipfs.tech/#${data.vehicleCid}`
    : null;

  return (
    <>
      {/* Vehicle Header + Verification Status */}
      <div className="rounded-lg border border-border bg-card p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {data.make} {data.model}
            </h1>
            <p className="text-lg text-muted-foreground">{data.year}</p>
          </div>
          <div>
            {data.isAnchored ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-green-500/10 px-4 py-2 text-green-600 dark:text-green-400">
                <ShieldCheck className="h-5 w-5" />
                <span className="font-semibold">{t('publicVerification.blockchainVerified')}</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-muted-foreground">
                <ShieldX className="h-5 w-5" />
                <span className="font-semibold">{t('publicVerification.notVerified')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Blockchain Details */}
        {data.isAnchored && (
          <div className="mt-6 space-y-3 border-t border-border pt-4">
            {data.blockchainAssetId && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <span className="text-sm font-medium text-muted-foreground min-w-[160px]">
                  {t('publicVerification.blockchainAssetId')}
                </span>
                <div className="flex items-center gap-2">
                  <code className="text-sm text-foreground bg-muted px-2 py-0.5 rounded">
                    {data.blockchainAssetId}
                  </code>
                  {explorerUrl && (
                    <a
                      href={explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                    >
                      {t('publicVerification.viewOnExplorer')}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            )}
            {data.vehicleCid && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <span className="text-sm font-medium text-muted-foreground min-w-[160px]">
                  {t('publicVerification.vehicleCid')}
                </span>
                <div className="flex items-center gap-2">
                  <code className="text-sm text-foreground bg-muted px-2 py-0.5 rounded break-all">
                    {data.vehicleCid}
                  </code>
                  {cidInspectorUrl && (
                    <a
                      href={cidInspectorUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors flex-shrink-0"
                    >
                      {t('publicVerification.inspectCid')}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{data.totalEvents}</p>
          <p className="text-sm text-muted-foreground">{t('publicVerification.totalEvents')}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{data.anchoredEvents}</p>
          <p className="text-sm text-muted-foreground">{t('publicVerification.anchoredEvents')}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{data.certifiedEvents}</p>
          <p className="text-sm text-muted-foreground">{t('publicVerification.certifiedEvents')}</p>
        </div>
      </div>

      {/* Events List */}
      <div className="rounded-lg border border-border bg-card p-6 mb-6">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground mb-4">
          <Clock className="h-5 w-5 text-primary" />
          {t('publicVerification.eventsSection')}
        </h2>

        {data.events.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('publicVerification.noEvents')}</p>
        ) : (
          <div className="space-y-3">
            {data.events.map((event) => (
              <EventRow key={event.id} event={event} network={data.algorandNetwork} />
            ))}
          </div>
        )}
      </div>

      {/* How to Verify */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-2">
          <BookOpen className="h-5 w-5 text-primary" />
          {t('publicVerification.howToVerify')}
        </h2>
        <p className="text-sm text-muted-foreground mb-3">
          {t('publicVerification.howToVerifyDescription')}
        </p>
        <a
          href="/concepts"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
        >
          {t('publicVerification.learnMore')}
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </>
  );
}

function EventRow({ event, network }: { event: VerificationEvent; network: string }) {
  const { t } = useTranslation('vehicle');

  const txUrl = event.blockchainTxId
    ? `https://lora.algokit.io/${network}/transaction/${event.blockchainTxId}`
    : null;

  const eventTypeKey = `eventTypes.${event.type}`;
  const eventTypeLabel = t(eventTypeKey, { defaultValue: event.type });

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/50 p-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-foreground truncate">{event.title}</span>
          {event.entityName && (
            <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full flex-shrink-0">
              <Award className="h-3 w-3" />
              {t('publicVerification.certified')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>{eventTypeLabel}</span>
          <span>·</span>
          <span>
            {new Date(event.date).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
          {event.entityName && (
            <>
              <span>·</span>
              <span>{event.entityName}</span>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {event.isAnchored ? (
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-green-500" />
            {txUrl && (
              <a
                href={txUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:text-primary/80 transition-colors"
              >
                {t('publicVerification.viewTransaction')}
              </a>
            )}
          </div>
        ) : (
          <ShieldX className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
    </div>
  );
}

function NotFoundView() {
  const { t } = useTranslation('vehicle');

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <BackButton />
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="h-6 w-6 flex-shrink-0 text-red-500 mt-1" />
            <div>
              <h2 className="font-semibold text-foreground mb-1">
                {t('publicVerification.notFound')}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t('publicVerification.notFoundDescription')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
