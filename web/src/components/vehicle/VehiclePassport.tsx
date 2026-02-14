import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck,
  Link as LinkIcon,
  Calendar,
  MapPin,
  Award,
  Wrench,
  Car,
  Flag,
  Trophy,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
  Building2,
} from 'lucide-react';
import type { Vehicle } from '@/types/vehicle';
import type { SharedVehicle, SharedPhoto, SharedDocument, SharedEvent } from '@/types/shareLink';
import { generateStorageUrl } from '@/lib/storage';
import { BrandLogo } from './BrandLogo';

type PassportPhoto = SharedPhoto | { id: string; objectKey: string };
type PassportDocument = SharedDocument | { id: string; objectKey: string; filename: string };
type PassportEvent = SharedEvent | {
  id: string;
  type: string;
  title: string;
  date: string;
  description?: string;
  location?: string;
  entityId?: string;
  entityName?: string;
  blockchainTxId?: string;
};

interface VehiclePassportProps {
  vehicle: Vehicle | SharedVehicle;
  events?: PassportEvent[];
  photos?: PassportPhoto[];
  documents?: PassportDocument[];
  showPhotos?: boolean;
  showDocuments?: boolean;
  showHistory?: boolean;
}

const eventTypeIcons: Record<string, typeof Award> = {
  certification: FileCheck,
  car_show: Trophy,
  classic_meet: Car,
  rally: Flag,
  vintage_racing: Flag,
  auction: Award,
  workshop: Wrench,
  club_competition: Trophy,
  road_trip: Car,
  festival: Award,
  race_participation: Flag,
  show_participation: Trophy,
  maintenance: Wrench,
  ownership_transfer: FileCheck,
  restoration: Wrench,
  modification: Wrench,
};

function getEventIcon(type: string) {
  return eventTypeIcons[type] || Calendar;
}

export function VehiclePassport({
  vehicle,
  events = [],
  photos = [],
  documents = [],
  showPhotos = true,
  showDocuments = true,
  showHistory = true,
}: VehiclePassportProps) {
  const { t } = useTranslation(['vehicle', 'dashboard']);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const heroPhoto = photos.length > 0 ? photos[0] : null;
  const galleryPhotos = photos.slice(1);
  const hasBlockchainData = 'blockchainAssetId' in vehicle && vehicle.blockchainAssetId;
  const hasVerifiedEvents = events.some(e => !!e.blockchainTxId);
  const network = import.meta.env.VITE_ALGORAND_NETWORK || 'testnet';

  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <div className="mx-auto max-w-3xl">
      {/* Passport Card */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-card via-card to-card/80 shadow-2xl">
        {/* Corner accents */}
        <div className="absolute left-0 top-0 h-16 w-16 border-l-2 border-t-2 border-primary/40 rounded-tl-2xl" />
        <div className="absolute bottom-0 right-0 h-16 w-16 border-b-2 border-r-2 border-primary/40 rounded-br-2xl" />

        {/* Hero Photo */}
        {showPhotos && heroPhoto && (
          <div className="relative h-64 sm:h-80">
            <img
              src={generateStorageUrl(heroPhoto.objectKey)}
              alt={`${vehicle.make} ${vehicle.model}`}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
          </div>
        )}

        {/* Header */}
        <div className={`p-6 ${heroPhoto ? '-mt-16 relative z-10' : 'pt-8'}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-primary uppercase tracking-widest font-medium mb-2">
                {t('passport.label')}
              </p>
              <div className="flex items-center gap-3">
                <BrandLogo make={vehicle.make} size="md" />
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </h1>
              </div>
              {vehicle.chassisNumber && (
                <p className="mt-2 font-mono text-sm text-muted-foreground">
                  {vehicle.chassisNumber}
                </p>
              )}
            </div>

            {/* Verification Badge */}
            {(hasBlockchainData || hasVerifiedEvents) && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex-shrink-0">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-medium text-emerald-500 hidden sm:inline">
                  {t('passport.verified')}
                </span>
              </div>
            )}
          </div>

          {/* Vehicle Details Grid */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {vehicle.color && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {t('fields.color')}
                </p>
                <p className="mt-0.5 text-sm font-medium text-foreground">{vehicle.color}</p>
              </div>
            )}
            {vehicle.licensePlate && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {t('fields.licensePlate')}
                </p>
                <p className="mt-0.5 text-sm font-mono text-foreground">{vehicle.licensePlate}</p>
              </div>
            )}
            {vehicle.engineNumber && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {t('fields.engineNumber')}
                </p>
                <p className="mt-0.5 text-sm font-mono text-foreground truncate">{vehicle.engineNumber}</p>
              </div>
            )}
            {vehicle.bodyType && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {t('vehicle:fields.bodyType')}
                </p>
                <p className="mt-0.5 text-sm text-foreground">{t(`dashboard:vehicleForm.bodyTypes.${vehicle.bodyType}`, { defaultValue: vehicle.bodyType })}</p>
              </div>
            )}
            {vehicle.driveType && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {t('vehicle:fields.driveType')}
                </p>
                <p className="mt-0.5 text-sm text-foreground">{t(`dashboard:vehicleForm.driveTypes.${vehicle.driveType}`, { defaultValue: vehicle.driveType })}</p>
              </div>
            )}
            {vehicle.gearType && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {t('vehicle:fields.gearType')}
                </p>
                <p className="mt-0.5 text-sm text-foreground">{t(`dashboard:vehicleForm.gearTypes.${vehicle.gearType}`, { defaultValue: vehicle.gearType })}</p>
              </div>
            )}
            {vehicle.suspensionType && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {t('vehicle:fields.suspensionType')}
                </p>
                <p className="mt-0.5 text-sm text-foreground">{t(`dashboard:vehicleForm.suspensionTypes.${vehicle.suspensionType}`, { defaultValue: vehicle.suspensionType })}</p>
              </div>
            )}
          </div>
        </div>

        {/* Photo Gallery */}
        {showPhotos && galleryPhotos.length > 0 && (
          <div className="px-6 pb-6">
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {galleryPhotos.slice(0, 6).map((photo, index) => (
                <div
                  key={photo.id}
                  className="aspect-square rounded-lg overflow-hidden cursor-pointer group relative"
                  onClick={() => openLightbox(index + 1)}
                >
                  <img
                    src={generateStorageUrl(photo.objectKey)}
                    alt=""
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                  {index === 5 && galleryPhotos.length > 6 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white font-semibold">+{galleryPhotos.length - 6}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Documents */}
        {showDocuments && documents.length > 0 && (
          <div className="px-6 pb-6">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
              {t('sections.documents')}
            </p>
            <div className="flex flex-wrap gap-2">
              {documents.map((doc) => (
                <a
                  key={doc.id}
                  href={generateStorageUrl(doc.objectKey)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <FileCheck className="w-3 h-3" />
                  {doc.filename}
                  <ExternalLink className="w-3 h-3 text-muted-foreground" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Divider */}
        {showHistory && sortedEvents.length > 0 && (
          <div className="mx-6 h-px bg-border" />
        )}

        {/* Timeline */}
        {showHistory && sortedEvents.length > 0 && (
          <div className="p-6">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-4">
              {t('passport.timeline')}
            </p>

            <div className="space-y-3">
              {sortedEvents.map((event, index) => {
                const Icon = getEventIcon(event.type);
                const isAnchored = !!event.blockchainTxId;
                const isCertified = !!event.entityId;

                return (
                  <div
                    key={event.id}
                    className="relative flex gap-4"
                  >
                    {/* Timeline connector */}
                    {index < sortedEvents.length - 1 && (
                      <div className="absolute left-[15px] top-10 bottom-0 w-px bg-border" />
                    )}

                    {/* Icon */}
                    <div className={`relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                      isAnchored
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : isCertified
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-muted/50'
                    }`}>
                      <Icon className={`h-4 w-4 ${
                        isAnchored
                          ? 'text-emerald-500'
                          : isCertified
                            ? 'text-primary'
                            : 'text-muted-foreground'
                      }`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pb-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-medium text-foreground truncate">
                            {event.title}
                          </h3>
                          {event.entityName && (
                            <p className="text-xs text-primary flex items-center gap-1 mt-0.5">
                              <Building2 className="w-3 h-3" />
                              {event.entityName}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isAnchored && (
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                          )}
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(event.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {event.description && (
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                          {event.description}
                        </p>
                      )}

                      {event.location && (
                        <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {event.location}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Blockchain Footer */}
        {hasBlockchainData && (
          <a
            href={`https://lora.algokit.io/${network}/asset/${(vehicle as Vehicle).blockchainAssetId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-4 px-6 py-4 border-t border-border bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <LinkIcon className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-xs text-muted-foreground">{t('passport.anchored')}</span>
            </div>
            <span className="text-xs font-mono text-primary truncate">
              {(vehicle as Vehicle).blockchainAssetId}
            </span>
          </a>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && photos.length > 0 && (
        <PhotoLightbox
          photos={photos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          onNext={() => setLightboxIndex((i) => (i + 1) % photos.length)}
          onPrevious={() => setLightboxIndex((i) => (i - 1 + photos.length) % photos.length)}
        />
      )}
    </div>
  );
}

interface PhotoLightboxProps {
  photos: PassportPhoto[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

function PhotoLightbox({ photos, currentIndex, onClose, onNext, onPrevious }: PhotoLightboxProps) {
  const photo = photos[currentIndex];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      {photos.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onPrevious(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white transition-colors"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </>
      )}

      <img
        src={generateStorageUrl(photo.objectKey)}
        alt=""
        className="max-h-[90vh] max-w-[90vw] object-contain"
        onClick={(e) => e.stopPropagation()}
      />

      {photos.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
          {currentIndex + 1} / {photos.length}
        </div>
      )}
    </div>
  );
}
