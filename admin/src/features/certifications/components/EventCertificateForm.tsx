import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useCreateEvent } from '../hooks/useVehicles';
import type {
  EventMetadata,
  CarShowMetadata,
  ClassicMeetMetadata,
  RallyMetadata,
  VintageRacingMetadata,
  AuctionMetadata,
  WorkshopMetadata,
  ClubCompetitionMetadata,
  RoadTripMetadata,
  FestivalMetadata,
  EventType,
} from '../types';

interface Entity {
  id: string;
  name: string;
  type: string;
}

interface EventCertificateFormProps {
  vehicleId: string;
  entities: Entity[];
  onSuccess?: () => void;
}

type EventTypeOption = Exclude<EventType, 'certification' | 'race_participation' | 'show_participation' | 'maintenance' | 'ownership_transfer' | 'restoration' | 'modification'>;

export function EventCertificateForm({ vehicleId, entities, onSuccess }: EventCertificateFormProps) {
  const { t } = useTranslation('vehicles');
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  const [selectedEventType, setSelectedEventType] = useState<EventTypeOption | ''>('');
  const [metadata, setMetadata] = useState<EventMetadata | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('');

  const { mutate: createEvent, isPending } = useCreateEvent();

  useEffect(() => {
    if (entities.length === 1) {
      setSelectedEntity(entities[0].id);
    }
  }, [entities]);

  useEffect(() => {
    if (selectedEventType) {
      initializeMetadata(selectedEventType);
    }
  }, [selectedEventType]);

  const initializeMetadata = (eventType: EventTypeOption) => {
    const certificateNumber = `CERT-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    switch (eventType) {
      case 'car_show':
        setMetadata({
          certificateNumber,
          category: '',
          award: '',
        } as CarShowMetadata);
        break;
      case 'classic_meet':
        setMetadata({
          certificateNumber,
          clubName: '',
          theme: '',
        } as ClassicMeetMetadata);
        break;
      case 'rally':
        setMetadata({
          certificateNumber,
          route: '',
          carNumber: '',
          coDriver: '',
        } as RallyMetadata);
        break;
      case 'vintage_racing':
        setMetadata({
          certificateNumber,
          trackName: '',
          raceClass: '',
          raceNumber: '',
          bestLapTime: '',
        } as VintageRacingMetadata);
        break;
      case 'auction':
        setMetadata({
          certificateNumber,
          auctionHouse: '',
          participantName: '',
          lotNumber: '',
          saleStatus: '',
        } as AuctionMetadata);
        break;
      case 'workshop':
        setMetadata({
          certificateNumber,
          workshopTopic: '',
          instructorName: '',
          completionAcknowledgment: false,
        } as WorkshopMetadata);
        break;
      case 'club_competition':
        setMetadata({
          certificateNumber,
          competitionCategory: '',
          awardTitle: '',
          clubChapter: '',
        } as ClubCompetitionMetadata);
        break;
      case 'road_trip':
        setMetadata({
          certificateNumber,
          routeName: '',
          totalDistance: undefined,
          checkpointsCompleted: [],
          dateRange: '',
        } as RoadTripMetadata);
        break;
      case 'festival':
        setMetadata({
          certificateNumber,
          festivalTheme: '',
          activitiesParticipatedIn: [],
        } as FestivalMetadata);
        break;
    }
  };

  const handleMetadataChange = (field: string, value: unknown) => {
    if (metadata) {
      setMetadata({
        ...metadata,
        [field]: value,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEntity || !selectedEventType || !metadata) return;

    createEvent(
      {
        vehicleId,
        entityId: selectedEntity,
        title: title || selectedEventType.replace(/_/g, ' '),
        description,
        type: selectedEventType,
        date: new Date(eventDate),
        location: location || undefined,
        metadata: metadata as any,
      },
      {
        onSuccess: () => {
          setTitle('');
          setDescription('');
          setEventDate(new Date().toISOString().split('T')[0]);
          setLocation('');
          setSelectedEventType('');
          setMetadata(null);
          // Close modal
          onSuccess?.();
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Entity Selection - Hidden temporarily, auto-selected */}
      {false && (
        <div>
          <label className="block text-sm font-medium mb-2">
            {t('form.entity')} *
          </label>
          <select
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            disabled={entities.length === 1}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            required
          >
            {entities.length > 1 && (
              <option value="">Select an entity...</option>
            )}
            {entities.map((entity) => (
              <option key={entity.id} value={entity.id}>
                {entity.name}
              </option>
            ))}
          </select>
          {entities.length === 1 && (
            <p className="text-xs text-muted-foreground mt-1">
              Automatically selected (only entity available)
            </p>
          )}
        </div>
      )}

      {/* Event Type Selection */}
      <div>
        <label className="block text-sm font-medium mb-2">
          {t('eventCertificate.fields.eventType')} *
        </label>
        <select
          value={selectedEventType}
          onChange={(e) => setSelectedEventType(e.target.value as EventTypeOption)}
          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
          required
        >
          <option value="">Select event type...</option>
          <option value="car_show">{t('eventCertificate.types.carShow')}</option>
          <option value="classic_meet">{t('eventCertificate.types.classicMeet')}</option>
          <option value="rally">{t('eventCertificate.types.rally')}</option>
          <option value="vintage_racing">{t('eventCertificate.types.vintageRacing')}</option>
          <option value="auction">{t('eventCertificate.types.auction')}</option>
          <option value="workshop">{t('eventCertificate.types.workshop')}</option>
          <option value="club_competition">{t('eventCertificate.types.clubCompetition')}</option>
          <option value="road_trip">{t('eventCertificate.types.roadTrip')}</option>
          <option value="festival">{t('eventCertificate.types.festival')}</option>
        </select>
      </div>

      {selectedEventType && (
        <>
          {/* Common Fields */}
          <div className="space-y-4 p-4 bg-muted rounded-lg">
            <h3 className="text-sm font-semibold">{t('eventCertificate.section.common')}</h3>

            <div>
              <label className="block text-sm font-medium mb-1">
                {t('eventCertificate.fields.title')} *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`e.g., ${selectedEventType.replace(/_/g, ' ')}`}
                required
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {t('eventCertificate.fields.date')} *
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {t('eventCertificate.fields.location')}
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Event location..."
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {t('eventCertificate.fields.description')}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Event details..."
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
          </div>

          {/* Type-Specific Fields */}
          {metadata && renderTypeSpecificFields(selectedEventType, metadata, handleMetadataChange, t)}
        </>
      )}

      {/* Submit Button */}
      <div className="flex gap-2 pt-4 border-t border-border">
        <button
          type="submit"
          disabled={isPending || !selectedEventType || !metadata || !selectedEntity}
          className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {isPending ? t('eventCertificate.actions.creating') : t('eventCertificate.actions.create')}
        </button>
      </div>
    </form>
  );
}

function renderTypeSpecificFields(
  eventType: EventTypeOption,
  metadata: EventMetadata,
  handleChange: (field: string, value: unknown) => void,
  t: (key: string) => string
) {
  const renderField = (label: string, field: string, type: string = 'text', required = false, placeholder = '') => (
    <div key={field}>
      <label className="block text-sm font-medium mb-1">
        {label} {required && '*'}
      </label>
      {type === 'textarea' ? (
        <textarea
          value={(metadata as any)[field] || ''}
          onChange={(e) => handleChange(field, e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
      ) : type === 'checkbox' ? (
        <input
          type="checkbox"
          checked={((metadata as any)[field] as boolean) || false}
          onChange={(e) => handleChange(field, e.target.checked)}
          className="w-4 h-4 border border-border rounded cursor-pointer"
        />
      ) : type === 'number' ? (
        <input
          type="number"
          value={((metadata as any)[field] as number) || ''}
          onChange={(e) => handleChange(field, e.target.value ? parseInt(e.target.value) : undefined)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      ) : (
        <input
          type={type}
          value={((metadata as any)[field] as string) || ''}
          onChange={(e) => handleChange(field, e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      )}
    </div>
  );

  switch (eventType) {
    case 'car_show':
      return (
        <div className="space-y-4 p-4 bg-muted rounded-lg">
          <h3 className="text-sm font-semibold">Details</h3>
          {renderField(t('eventCertificate.fields.category'), 'category', 'text', false)}
          {renderField(t('eventCertificate.fields.award'), 'award', 'text')}
          {renderField(t('eventCertificate.fields.judgingScore'), 'judgingScore', 'number')}
        </div>
      );
    case 'classic_meet':
      return (
        <div className="space-y-4 p-4 bg-muted rounded-lg">
          <h3 className="text-sm font-semibold">Details</h3>
          {renderField(t('eventCertificate.fields.clubName'), 'clubName', 'text', false)}
          {renderField(t('eventCertificate.fields.theme'), 'theme', 'text')}
        </div>
      );
    case 'rally':
      return (
        <div className="space-y-4 p-4 bg-muted rounded-lg">
          <h3 className="text-sm font-semibold">Details</h3>
          {renderField(t('eventCertificate.fields.route'), 'route', 'text', false)}
          {renderField(t('eventCertificate.fields.carNumber'), 'carNumber', 'text')}
          {renderField(t('eventCertificate.fields.coDriver'), 'coDriver', 'text')}
          {renderField(t('eventCertificate.fields.distanceDriven'), 'distanceDriven', 'number')}
        </div>
      );
    case 'vintage_racing':
      return (
        <div className="space-y-4 p-4 bg-muted rounded-lg">
          <h3 className="text-sm font-semibold">Details</h3>
          {renderField(t('eventCertificate.fields.trackName'), 'trackName', 'text', false)}
          {renderField(t('eventCertificate.fields.raceClass'), 'raceClass', 'text', false)}
          {renderField(t('eventCertificate.fields.raceNumber'), 'raceNumber', 'text')}
          {renderField(t('eventCertificate.fields.bestLapTime'), 'bestLapTime', 'text')}
        </div>
      );
    case 'auction':
      return (
        <div className="space-y-4 p-4 bg-muted rounded-lg">
          <h3 className="text-sm font-semibold">Details</h3>
          {renderField(t('eventCertificate.fields.auctionHouse'), 'auctionHouse', 'text', false)}
          {renderField(t('eventCertificate.fields.participantName'), 'participantName', 'text')}
          {renderField(t('eventCertificate.fields.lotNumber'), 'lotNumber', 'text')}
          {renderField(t('eventCertificate.fields.saleStatus'), 'saleStatus', 'text')}
        </div>
      );
    case 'workshop':
      return (
        <div className="space-y-4 p-4 bg-muted rounded-lg">
          <h3 className="text-sm font-semibold">Details</h3>
          {renderField(t('eventCertificate.fields.workshopTopic'), 'workshopTopic', 'text', false)}
          {renderField(t('eventCertificate.fields.instructorName'), 'instructorName', 'text')}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={((metadata as any)['completionAcknowledgment'] as boolean) || false}
                onChange={(e) => handleChange('completionAcknowledgment', e.target.checked)}
                className="w-4 h-4 border border-border rounded cursor-pointer"
              />
              <span className="text-sm font-medium">{t('eventCertificate.fields.completionAcknowledgment')}</span>
            </label>
          </div>
        </div>
      );
    case 'club_competition':
      return (
        <div className="space-y-4 p-4 bg-muted rounded-lg">
          <h3 className="text-sm font-semibold">Details</h3>
          {renderField(t('eventCertificate.fields.competitionCategory'), 'competitionCategory', 'text', false)}
          {renderField(t('eventCertificate.fields.awardTitle'), 'awardTitle', 'text', false)}
          {renderField(t('eventCertificate.fields.clubChapter'), 'clubChapter', 'text')}
        </div>
      );
    case 'road_trip':
      return (
        <div className="space-y-4 p-4 bg-muted rounded-lg">
          <h3 className="text-sm font-semibold">Details</h3>
          {renderField(t('eventCertificate.fields.routeName'), 'routeName', 'text', false)}
          {renderField(t('eventCertificate.fields.totalDistance'), 'totalDistance', 'number')}
          {renderField(t('eventCertificate.fields.dateRange'), 'dateRange', 'text')}
        </div>
      );
    case 'festival':
      return (
        <div className="space-y-4 p-4 bg-muted rounded-lg">
          <h3 className="text-sm font-semibold">Details</h3>
          {renderField(t('eventCertificate.fields.festivalTheme'), 'festivalTheme', 'text', false)}
        </div>
      );
    default:
      return null;
  }
}
