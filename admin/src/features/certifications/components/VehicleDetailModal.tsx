import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Calendar, MapPin, Award, ExternalLink, ImageIcon, Link } from 'lucide-react';
import { CertificationForm } from './CertificationForm';
import { EventCertificateForm } from './EventCertificateForm';
import { OwnerManagementSection } from './OwnerManagementSection';
import { useVehicleEvents } from '../hooks/useVehicles';
import { generateStorageUrl } from '@/lib/storage';
import type { Vehicle, EventType } from '../types';

interface Entity {
  id: string;
  name: string;
  type: string;
}

interface VehicleDetailModalProps {
  vehicle: Vehicle;
  entities: Entity[];
  isOpen: boolean;
  onClose: () => void;
  initialTab?: Tab;
}

type Tab = 'details' | 'history' | 'certifications' | 'event-certificates';

interface EventImage {
  id: string;
  eventId?: string;
  objectKey: string;
  cid?: string;
  createdAt: string;
}

interface VehicleEvent {
  id: string;
  vehicleId: string;
  entityId?: string;
  type: EventType;
  title: string;
  description?: string;
  date: string;
  location?: string;
  metadata?: Record<string, any>;
  blockchainTxId?: string;
  cid?: string;
  createdAt: string;
  images?: EventImage[];
}

const getEventTypeBadgeColor = (type: EventType): string => {
  const colorMap: Record<EventType, string> = {
    certification: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100',
    car_show: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100',
    classic_meet: 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-100',
    rally: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100',
    vintage_racing: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-100',
    auction: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-100',
    workshop: 'bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-100',
    club_competition: 'bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-100',
    road_trip: 'bg-lime-100 dark:bg-lime-900 text-lime-800 dark:text-lime-100',
    festival: 'bg-violet-100 dark:bg-violet-900 text-violet-800 dark:text-violet-100',
    race_participation: 'bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-100',
    show_participation: 'bg-fuchsia-100 dark:bg-fuchsia-900 text-fuchsia-800 dark:text-fuchsia-100',
    maintenance: 'bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100',
    ownership_transfer: 'bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-100',
    restoration: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-100',
    modification: 'bg-sky-100 dark:bg-sky-900 text-sky-800 dark:text-sky-100',
  };
  return colorMap[type] || 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100';
};

const formatEventType = (type: EventType): string => {
  return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

interface EventGroup {
  year: number;
  events: VehicleEvent[];
}

interface EventHistoryTabProps {
  events: VehicleEvent[];
  isLoading: boolean;
  onAddEvent: () => void;
}

function EventHistoryTab({ events, isLoading, onAddEvent }: EventHistoryTabProps) {
  const { t } = useTranslation('vehicles');

  const groupedEvents = useMemo(() => {
    const sortedEvents = [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const groups: EventGroup[] = [];
    let currentYear: number | null = null;
    let currentGroup: EventGroup | null = null;

    for (const event of sortedEvents) {
      const eventYear = new Date(event.date).getFullYear();

      if (eventYear !== currentYear) {
        if (currentGroup) {
          groups.push(currentGroup);
        }
        currentYear = eventYear;
        currentGroup = { year: eventYear, events: [event] };
      } else {
        currentGroup?.events.push(event);
      }
    }

    if (currentGroup) {
      groups.push(currentGroup);
    }

    return groups;
  }, [events]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading event history...</div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Award className="w-12 h-12 text-gray-300 mb-3" />
        <p className="text-muted-foreground">{t('modal.history.empty', 'No events recorded yet')}</p>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          {t('modal.history.emptyHint', 'Event history will appear here once certifications or events are added')}
        </p>
        <button
          onClick={onAddEvent}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 hover:bg-primary/5 rounded-md transition-colors cursor-pointer"
        >
          {t('modal.history.addEvent', 'Add first event')}
          <span aria-hidden="true">→</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline connector */}
      <div className="absolute left-[7px] top-0 bottom-0 w-0.5 bg-border" />

      <div className="space-y-6">
        {groupedEvents.map((group, groupIndex) => {
          const anchoredCount = group.events.filter(e => !!e.blockchainTxId).length;
          const isFirstGroup = groupIndex === 0;

          return (
            <div key={group.year} className="relative">
              {/* Year marker */}
              <div className={`relative flex items-center gap-3 ${isFirstGroup ? '' : 'pt-2'}`}>
                <div className="relative z-10 flex items-center justify-center">
                  <div className="flex items-center gap-2 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground shadow-sm">
                    <span>{group.year}</span>
                    {anchoredCount > 0 && (
                      <span className="flex items-center gap-1 text-emerald-300">
                        <Link className="h-3 w-3" />
                        {anchoredCount}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {group.events.length} {group.events.length === 1 ? t('modal.history.event', 'event') : t('modal.history.events', 'events')}
                </span>
              </div>

              {/* Events for this year */}
              <div className="mt-4 space-y-4">
                {group.events.map((event, eventIndex) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    isLast={groupIndex === groupedEvents.length - 1 && eventIndex === group.events.length - 1}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface EventCardProps {
  event: VehicleEvent;
  isLast: boolean;
}

function EventCard({ event, isLast }: EventCardProps) {
  const { t } = useTranslation('vehicles');
  const hasBlockchainProof = !!event.blockchainTxId;

  const formatMetadataKey = (key: string): string => {
    const translated = t(`eventCertificate.fields.${key}`, { defaultValue: '' });
    if (translated) return translated;
    return key.replace(/([A-Z])/g, ' $1').trim().replace(/^./, c => c.toUpperCase());
  };

  return (
    <div className="relative pl-8">
      {/* Timeline connector dot */}
      <div className="absolute left-0 top-4 z-10">
        <div className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
          hasBlockchainProof
            ? 'border-emerald-500 bg-emerald-500/10'
            : 'border-primary bg-primary/10'
        }`}>
          <div className={`h-2 w-2 rounded-full ${
            hasBlockchainProof
              ? 'bg-emerald-500'
              : 'bg-primary'
          }`} />
        </div>
      </div>

      {/* Hide the main line at the last event */}
      {isLast && (
        <div className="absolute left-[7px] top-6 bottom-0 w-0.5 bg-card" />
      )}

      {/* Event card */}
      <div className="bg-muted rounded-lg p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${getEventTypeBadgeColor(event.type)}`}>
                {formatEventType(event.type)}
              </span>
              {event.metadata?.certificateNumber && (
                <code className="text-xs bg-background px-2 py-1 rounded border border-border">
                  #{event.metadata.certificateNumber}
                </code>
              )}
            </div>
            <h4 className="font-semibold">{event.title}</h4>
          </div>
        </div>

        {/* Description */}
        {event.description && (
          <p className="text-sm text-muted-foreground">{event.description}</p>
        )}

        {/* Event Images */}
        {event.images && event.images.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2 text-xs text-muted-foreground">
              <ImageIcon className="h-3 w-3" />
              <span>{event.images.length} {event.images.length === 1 ? 'image' : 'images'}</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {event.images.slice(0, 4).map((image, index) => (
                <div
                  key={image.id}
                  className="relative aspect-square overflow-hidden rounded-md border border-border bg-muted"
                >
                  <img
                    src={generateStorageUrl(image.objectKey)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  {index === 3 && event.images!.length > 4 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white text-sm font-medium">
                      +{event.images!.length - 4}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{new Date(event.date).toLocaleDateString()}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{event.location}</span>
            </div>
          )}
          {event.blockchainTxId && (
            <div className="flex items-center gap-1">
              <ExternalLink className="w-4 h-4" />
              <a
                href={`https://explorer.perawallet.app/tx/${event.blockchainTxId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Blockchain
              </a>
            </div>
          )}
        </div>

        {/* Additional metadata fields */}
        {event.metadata && Object.keys(event.metadata).length > 1 && (
          <div className="pt-2 border-t border-border">
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(event.metadata)
                .filter(([key]) => key !== 'certificateNumber')
                .map(([key, value]) => (
                  <div key={key}>
                    <span className="text-muted-foreground">
                      {formatMetadataKey(key)}:
                    </span>
                    <span className="ml-1 font-medium">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function VehicleDetailModal({
  vehicle,
  entities,
  isOpen,
  onClose,
  initialTab = 'details',
}: VehicleDetailModalProps) {
  const { t } = useTranslation('vehicles');
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const { data: events = [], isLoading: isLoadingEvents } = useVehicleEvents(vehicle.id);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const formatFieldValue = (value: string | null | undefined, optionType: string): string => {
    if (!value) return '-';
    const translated = t(`form.options.${optionType}.${value}`, { defaultValue: '' });
    return translated || value;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-card rounded-t-lg">
          <div>
            <h2 className="text-2xl font-bold">
              {vehicle.make} {vehicle.model}
            </h2>
            <p className="text-sm text-muted-foreground">{vehicle.year}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-border bg-card">
          <div className="flex gap-6 px-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-3 font-medium text-sm border-b-2 transition-colors cursor-pointer ${
                activeTab === 'details'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('modal.tabs.details')}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-3 font-medium text-sm border-b-2 transition-colors cursor-pointer ${
                activeTab === 'history'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('modal.tabs.history')}
            </button>
            <button
              onClick={() => setActiveTab('certifications')}
              className={`py-3 font-medium text-sm border-b-2 transition-colors cursor-pointer ${
                activeTab === 'certifications'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('modal.tabs.certifications')}
            </button>
            <button
              onClick={() => setActiveTab('event-certificates')}
              className={`py-3 font-medium text-sm border-b-2 transition-colors cursor-pointer ${
                activeTab === 'event-certificates'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('modal.tabs.eventCertificates')}
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Identification */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                  {t('modal.sections.identification')}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {t('form.fields.licensePlate')}
                    </p>
                    <p className="text-sm font-medium">
                      {vehicle.licensePlate || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {t('form.fields.chassisNumber')}
                    </p>
                    <p className="text-sm font-medium">
                      {vehicle.chassisNumber || '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Basic Information */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                  {t('modal.sections.basic')}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {t('form.fields.make')}
                    </p>
                    <p className="text-sm font-medium">{vehicle.make}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {t('form.fields.model')}
                    </p>
                    <p className="text-sm font-medium">{vehicle.model}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {t('form.fields.year')}
                    </p>
                    <p className="text-sm font-medium">{vehicle.year}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {t('form.fields.color')}
                    </p>
                    <p className="text-sm font-medium">
                      {vehicle.color || '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Technical Information */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                  {t('modal.sections.technical')}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {t('form.fields.engineNumber')}
                    </p>
                    <p className="text-sm font-medium">
                      {vehicle.engineNumber || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {t('form.fields.transmissionNumber')}
                    </p>
                    <p className="text-sm font-medium">
                      {vehicle.transmissionNumber || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {t('form.fields.bodyType')}
                    </p>
                    <p className="text-sm font-medium">
                      {formatFieldValue(vehicle.bodyType, 'bodyTypes')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {t('form.fields.driveType')}
                    </p>
                    <p className="text-sm font-medium">
                      {formatFieldValue(vehicle.driveType, 'driveTypes')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {t('form.fields.gearType')}
                    </p>
                    <p className="text-sm font-medium">
                      {formatFieldValue(vehicle.gearType, 'gearTypes')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {t('form.fields.suspensionType')}
                    </p>
                    <p className="text-sm font-medium">
                      {formatFieldValue(vehicle.suspensionType, 'suspensionTypes')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Owner Management */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                  {t('ownerManagement.title')}
                </h3>
                <OwnerManagementSection vehicleId={vehicle.id} />
              </div>

              {/* Blockchain Information */}
              {vehicle.blockchainAssetId && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mb-2">
                    {t('modal.sections.blockchain', 'Blockchain')}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-sm font-mono text-emerald-800 dark:text-emerald-300 break-all">
                      {vehicle.blockchainAssetId}
                    </code>
                    <a
                      href={`https://lora.algokit.io/testnet/asset/${vehicle.blockchainAssetId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/50 hover:bg-emerald-200 dark:hover:bg-emerald-900 rounded-md transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      {t('modal.sections.viewOnBlockchain', 'View on Explorer')}
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <EventHistoryTab
              events={events as VehicleEvent[]}
              isLoading={isLoadingEvents}
              onAddEvent={() => setActiveTab('event-certificates')}
            />
          )}

          {activeTab === 'certifications' && (
            <CertificationForm
              vehicleId={vehicle.id}
              entities={entities}
              onSuccess={onClose}
            />
          )}

          {activeTab === 'event-certificates' && (
            <EventCertificateForm
              vehicleId={vehicle.id}
              entities={entities}
              onSuccess={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}
