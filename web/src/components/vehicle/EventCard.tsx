import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Calendar,
  MapPin,
  Shield,
  User,
  Award,
  Wrench,
  Hammer,
  RotateCw,
  HandshakeIcon,
  Trophy,
  Zap,
  Gavel,
  BookOpen,
  Users,
  Route,
  Sparkles,
  ChevronDown,
  Copy,
  Check,
  ExternalLink,
  Search,
  ImageIcon,
} from 'lucide-react';
import type { Event, EventType } from '@/types/vehicle';
import { VerificationModal } from './VerificationModal';
import { PhotoLightbox } from './PhotoLightbox';
import { generateStorageUrl } from '@/lib/storage';

interface EventCardProps {
  event: Event;
  isCertified: boolean;
  entityName?: string;
}

export function EventCard({ event, isCertified, entityName }: EventCardProps) {
  const { t } = useTranslation(['vehicle', 'verification']);
  const [showBlockchainDetails, setShowBlockchainDetails] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const canVerify = event.blockchainTxId && event.cid && event.cidSourceJSON && event.cidSourceCBOR;
  const network = import.meta.env.VITE_ALGORAND_NETWORK || 'testnet';

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const BlockchainDataField = ({
    label,
    value,
    fieldId,
  }: {
    label: string;
    value: string;
    fieldId: string;
  }) => {
    const isTransactionId = fieldId === 'tx-id';
    const isCid = fieldId === 'cid';

    let explorerUrl: string | undefined;
    if (isTransactionId) {
      explorerUrl = `https://lora.algokit.io/${network}/transaction/${value}`;
    } else if (isCid) {
      explorerUrl = `https://cid.ipfs.tech/#${value}`;
    }

    return (
      <div className="flex items-start justify-between gap-2 p-2 rounded bg-muted/50 text-xs">
        <div className="flex-1 min-w-0">
          <span className="text-muted-foreground">{label}:</span>
          <div className="flex items-center gap-1 mt-1">
            <code className="break-all font-mono text-foreground">
              {value}
            </code>
            {explorerUrl && (
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 p-1 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-primary"
                title={isTransactionId ? 'View on Algorand Explorer' : 'View on IPFS'}
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => copyToClipboard(value, fieldId)}
          className="flex-shrink-0 cursor-pointer p-1 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-foreground"
          title="Copy to clipboard"
        >
          {copiedField === fieldId ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>
    );
  };

  const getEventTypeIcon = (type: EventType) => {
    const iconProps = 'h-5 w-5';
    switch (type) {
      case 'certification':
        return <Shield className={iconProps} />;
      case 'car_show':
        return <Trophy className={iconProps} />;
      case 'classic_meet':
        return <Users className={iconProps} />;
      case 'rally':
        return <Route className={iconProps} />;
      case 'vintage_racing':
        return <Zap className={iconProps} />;
      case 'auction':
        return <Gavel className={iconProps} />;
      case 'workshop':
        return <BookOpen className={iconProps} />;
      case 'club_competition':
        return <Award className={iconProps} />;
      case 'road_trip':
        return <Route className={iconProps} />;
      case 'festival':
        return <Sparkles className={iconProps} />;
      case 'race_participation':
        return <Zap className={iconProps} />;
      case 'show_participation':
        return <Trophy className={iconProps} />;
      case 'maintenance':
        return <Wrench className={iconProps} />;
      case 'restoration':
        return <Hammer className={iconProps} />;
      case 'modification':
        return <RotateCw className={iconProps} />;
      case 'ownership_transfer':
        return <HandshakeIcon className={iconProps} />;
      default:
        return <Award className={iconProps} />;
    }
  };

  const getEventTypeLabel = (type: EventType) => {
    const labels: Record<EventType, string> = {
      certification: t('vehicle:eventTypes.certification'),
      car_show: t('vehicle:eventTypes.carShow'),
      classic_meet: t('vehicle:eventTypes.classicMeet'),
      rally: t('vehicle:eventTypes.rally'),
      vintage_racing: t('vehicle:eventTypes.vintageRacing'),
      auction: t('vehicle:eventTypes.auction'),
      workshop: t('vehicle:eventTypes.workshop'),
      club_competition: t('vehicle:eventTypes.clubCompetition'),
      road_trip: t('vehicle:eventTypes.roadTrip'),
      festival: t('vehicle:eventTypes.festival'),
      race_participation: t('vehicle:eventTypes.raceParticipation'),
      show_participation: t('vehicle:eventTypes.showParticipation'),
      maintenance: t('vehicle:eventTypes.maintenance'),
      restoration: t('vehicle:eventTypes.restoration'),
      modification: t('vehicle:eventTypes.modification'),
      ownership_transfer: t('vehicle:eventTypes.ownershipTransfer'),
    };
    return labels[type] || type;
  };

  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <>
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            {/* Header with badge */}
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {getEventTypeIcon(event.type)}
                </div>
                <h3 className="font-semibold text-foreground">{event.title}</h3>
              </div>
              <span
                className={`flex-shrink-0 inline-flex flex-col items-center rounded-lg px-2.5 py-1 text-xs ${
                  isCertified
                    ? 'bg-blue-500/10 text-blue-500'
                    : 'bg-amber-500/10 text-amber-500'
                }`}
              >
                {isCertified ? (
                  <>
                    <span className="flex items-center gap-1 font-medium">
                      {event.entityLogoObjectKey ? (
                        <img
                          src={generateStorageUrl(event.entityLogoObjectKey)}
                          alt=""
                          className="h-3.5 w-3.5 rounded-sm object-cover"
                        />
                      ) : (
                        <Shield className="h-3 w-3" />
                      )}
                      {t('vehicle:eventBadges.certified')}
                    </span>
                    {entityName && (
                      <span className="text-[10px] text-blue-400/80">{entityName}</span>
                    )}
                  </>
                ) : (
                  <span className="flex items-center gap-1 font-medium">
                    <User className="h-3 w-3" />
                    {t('vehicle:eventBadges.ownerProvided')}
                  </span>
                )}
              </span>
            </div>

            {/* Event type and date */}
            <div className="mb-2 text-sm text-muted-foreground">
              <span>{getEventTypeLabel(event.type)}</span>
            </div>

            {/* Description */}
            {event.description && (
              <p className="mb-3 text-sm text-foreground">{event.description}</p>
            )}

            {/* Event Images */}
            {event.images && event.images.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-1.5 mb-2 text-xs text-muted-foreground">
                  <ImageIcon className="h-3 w-3" />
                  <span>{event.images.length} {event.images.length === 1 ? 'image' : 'images'}</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {event.images.slice(0, 4).map((image, index) => (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => {
                        setSelectedImageIndex(index);
                        setLightboxOpen(true);
                      }}
                      className="relative aspect-square overflow-hidden rounded-md border border-border bg-muted cursor-pointer group"
                    >
                      <img
                        src={generateStorageUrl(image.objectKey)}
                        alt=""
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                      {index === 3 && event.images!.length > 4 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white text-sm font-medium">
                          +{event.images!.length - 4}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Event details */}
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{formattedDate}</span>
              </div>

              {event.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{event.location}</span>
                </div>
              )}

              {(event.blockchainTxId || event.cid || event.cidSourceJSON || event.cidSourceCBOR) && (
                <div className="pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowBlockchainDetails(!showBlockchainDetails)}
                    className="flex cursor-pointer items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    <span>Blockchain & Anchoring Data</span>
                    <ChevronDown
                      className={`h-3 w-3 transition-transform ${
                        showBlockchainDetails ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {showBlockchainDetails && (
                    <div className="mt-3 space-y-2">
                      {event.blockchainTxId && (
                        <BlockchainDataField
                          label="Blockchain Transaction"
                          value={event.blockchainTxId}
                          fieldId="tx-id"
                        />
                      )}

                      {event.cid && (
                        <BlockchainDataField
                          label="Content ID (CID)"
                          value={event.cid}
                          fieldId="cid"
                        />
                      )}

                      {event.cidSourceJSON && (
                        <BlockchainDataField
                          label="CID Source (DAG-JSON)"
                          value={event.cidSourceJSON}
                          fieldId="cid-json"
                        />
                      )}

                      {event.cidSourceCBOR && (
                        <BlockchainDataField
                          label="CID Source (DAG-CBOR, Base64)"
                          value={event.cidSourceCBOR}
                          fieldId="cid-cbor"
                        />
                      )}

                      {canVerify && (
                        <button
                          type="button"
                          onClick={() => setShowVerificationModal(true)}
                          className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                        >
                          <Search className="h-3.5 w-3.5" />
                          {t('verification:button')}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {canVerify && (
        <VerificationModal
          open={showVerificationModal}
          onOpenChange={setShowVerificationModal}
          data={{
            eventTitle: event.title,
            eventDate: event.date,
            cidSourceJSON: event.cidSourceJSON!,
            cidSourceCBOR: event.cidSourceCBOR!,
            cid: event.cid!,
            blockchainTxId: event.blockchainTxId!,
            network,
          }}
        />
      )}

      {event.images && event.images.length > 0 && (
        <PhotoLightbox
          isOpen={lightboxOpen}
          photos={event.images}
          selectedIndex={selectedImageIndex}
          onClose={() => setLightboxOpen(false)}
          onNext={() => setSelectedImageIndex((prev) => (prev + 1) % event.images!.length)}
          onPrevious={() => setSelectedImageIndex((prev) => (prev - 1 + event.images!.length) % event.images!.length)}
        />
      )}
    </>
  );
}
