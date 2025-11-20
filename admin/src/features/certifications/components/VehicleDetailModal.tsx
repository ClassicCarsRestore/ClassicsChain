import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Calendar, MapPin, Award, ExternalLink } from 'lucide-react';
import { CertificationForm } from './CertificationForm';
import { EventCertificateForm } from './EventCertificateForm';
import { useVehicleEvents } from '../hooks/useVehicles';
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
            className="p-1 hover:bg-muted rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-border bg-card">
          <div className="flex gap-6 px-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'details'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('modal.tabs.details')}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'history'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('modal.tabs.history')}
            </button>
            <button
              onClick={() => setActiveTab('certifications')}
              className={`py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'certifications'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('modal.tabs.certifications')}
            </button>
            <button
              onClick={() => setActiveTab('event-certificates')}
              className={`py-3 font-medium text-sm border-b-2 transition-colors ${
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
                      {vehicle.bodyType || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {t('form.fields.driveType')}
                    </p>
                    <p className="text-sm font-medium">
                      {vehicle.driveType || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {t('form.fields.gearType')}
                    </p>
                    <p className="text-sm font-medium">
                      {vehicle.gearType || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {t('form.fields.suspensionType')}
                    </p>
                    <p className="text-sm font-medium">
                      {vehicle.suspensionType || '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Ownership Status */}
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">
                  {t('modal.sections.status')}
                </p>
                {vehicle.ownerId ? (
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 rounded">
                    {t('browse.status.owned')} - {vehicle.ownerId}
                  </span>
                ) : (
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100 rounded">
                    {t('browse.status.orphaned')}
                  </span>
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              {isLoadingEvents ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-muted-foreground">Loading event history...</div>
                </div>
              ) : events.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Award className="w-12 h-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No events recorded yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Event history will appear here once certifications or events are added
                  </p>
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline connector */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

                  {/* Event cards */}
                  <div className="space-y-6">
                    {(events as VehicleEvent[])
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((event) => (
                        <div key={event.id} className="relative pl-12">
                          {/* Timeline dot */}
                          <div className="absolute left-2.5 top-2 w-3 h-3 rounded-full bg-primary border-2 border-card" />

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
                                          {key.replace(/([A-Z])/g, ' $1').trim()}:
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
                      ))}
                  </div>
                </div>
              )}
            </div>
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
