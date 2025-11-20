import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import type { EventType, CreateOwnerEventRequest } from '@/types/vehicle';

interface VehicleEventCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (eventData: CreateOwnerEventRequest) => Promise<void>;
  vehicleId: string;
  isSubmitting: boolean;
}

export function VehicleEventCreateModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: VehicleEventCreateModalProps) {
  const { t } = useTranslation();
  const [eventType, setEventType] = useState<EventType>('maintenance');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const eventTypes: EventType[] = [
    'maintenance',
    'restoration',
    'modification',
    'race_participation',
    'show_participation',
    'ownership_transfer',
  ];

  const getEventTypeLabel = (type: EventType): string => {
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
      ownership_transfer: t('vehicle:eventTypes.ownershipTransfer'),
      restoration: t('vehicle:eventTypes.restoration'),
      modification: t('vehicle:eventTypes.modification'),
    };
    return labels[type] || type;
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!title?.trim()) {
      errors.title = t('vehicle:eventForm.validation.titleRequired');
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setValidationErrors({});

    if (!validateForm()) {
      return;
    }

    try {
      const eventData: CreateOwnerEventRequest = {
        type: eventType,
        title,
        description: description || undefined,
        date: date || undefined,
        location: location || undefined,
      };

      await onSubmit(eventData);
      resetForm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('vehicle:eventForm.error'));
    }
  };

  const resetForm = () => {
    setEventType('maintenance');
    setTitle('');
    setDescription('');
    setDate('');
    setLocation('');
    setValidationErrors({});
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-card shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-6">
          <h2 className="text-lg font-semibold text-foreground">
            {t('vehicle:eventForm.title')}
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 p-3">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Event Type */}
            <div>
              <label htmlFor="eventType" className="block text-sm font-medium text-foreground">
                {t('vehicle:eventForm.fields.type')}
              </label>
              <select
                id="eventType"
                value={eventType}
                onChange={(e) => setEventType(e.target.value as EventType)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {eventTypes.map((type) => (
                  <option key={type} value={type}>
                    {getEventTypeLabel(type)}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-foreground">
                {t('vehicle:eventForm.fields.title')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('vehicle:eventForm.fields.titlePlaceholder')}
                className={`mt-1 w-full rounded-md border ${
                  validationErrors.title ? 'border-red-500' : 'border-border'
                } bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary`}
              />
              {validationErrors.title && (
                <p className="mt-1 text-sm text-red-500">{validationErrors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-foreground">
                {t('vehicle:eventForm.fields.description')}
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('vehicle:eventForm.fields.descriptionPlaceholder')}
                rows={3}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Event Date */}
            <div>
              <label htmlFor="eventDate" className="block text-sm font-medium text-foreground">
                {t('vehicle:eventForm.fields.eventDate')}
              </label>
              <input
                type="date"
                id="eventDate"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {t('vehicle:eventForm.fields.dateOptional') || 'Optional - if not set, defaults to today'}
              </p>
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-foreground">
                {t('vehicle:eventForm.fields.location')}
              </label>
              <input
                type="text"
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t('vehicle:eventForm.fields.locationPlaceholder')}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
            >
              {t('vehicle:eventForm.buttons.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? t('vehicle:eventForm.buttons.creating') : t('vehicle:eventForm.buttons.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
