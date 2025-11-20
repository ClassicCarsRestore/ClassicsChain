import { useTranslation } from 'react-i18next';
import type { EventType, EventMetadata } from '../types';

interface EventCertificateFormFieldsProps {
  eventType: EventType;
  metadata: EventMetadata;
  onChange: (field: string, value: unknown) => void;
}

export function EventCertificateFormFields({
  eventType,
  metadata,
  onChange,
}: EventCertificateFormFieldsProps) {
  const { t } = useTranslation('vehicles');

  const renderField = (label: string, field: string, type: string = 'text', required = false, placeholder = '') => (
    <div key={field}>
      <label className="block text-sm font-medium mb-1">
        {label} {required && '*'}
      </label>
      {type === 'textarea' ? (
        <textarea
          value={((metadata as any)[field] as string) || ''}
          onChange={(e) => onChange(field, e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
      ) : type === 'checkbox' ? (
        <input
          type="checkbox"
          checked={((metadata as any)[field] as boolean) || false}
          onChange={(e) => onChange(field, e.target.checked)}
          className="w-4 h-4 border border-border rounded cursor-pointer"
        />
      ) : type === 'number' ? (
        <input
          type="number"
          value={((metadata as any)[field] as number) || ''}
          onChange={(e) => onChange(field, e.target.value ? parseInt(e.target.value) : undefined)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      ) : (
        <input
          type={type}
          value={((metadata as any)[field] as string) || ''}
          onChange={(e) => onChange(field, e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      )}
    </div>
  );

  switch (eventType) {
    case 'car_show':
      return (
        <div className="bg-white shadow-md rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold">Details</h2>
          {renderField(t('eventCertificate.fields.category'), 'category', 'text', false)}
          {renderField(t('eventCertificate.fields.award'), 'award', 'text')}
          {renderField(t('eventCertificate.fields.judgingScore'), 'judgingScore', 'number')}
        </div>
      );
    case 'classic_meet':
      return (
        <div className="bg-white shadow-md rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold">Details</h2>
          {renderField(t('eventCertificate.fields.clubName'), 'clubName', 'text', false)}
          {renderField(t('eventCertificate.fields.theme'), 'theme', 'text')}
        </div>
      );
    case 'rally':
      return (
        <div className="bg-white shadow-md rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold">Details</h2>
          {renderField(t('eventCertificate.fields.route'), 'route', 'text', false)}
          {renderField(t('eventCertificate.fields.carNumber'), 'carNumber', 'text')}
          {renderField(t('eventCertificate.fields.coDriver'), 'coDriver', 'text')}
          {renderField(t('eventCertificate.fields.distanceDriven'), 'distanceDriven', 'number')}
        </div>
      );
    case 'vintage_racing':
      return (
        <div className="bg-white shadow-md rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold">Details</h2>
          {renderField(t('eventCertificate.fields.trackName'), 'trackName', 'text', false)}
          {renderField(t('eventCertificate.fields.raceClass'), 'raceClass', 'text', false)}
          {renderField(t('eventCertificate.fields.raceNumber'), 'raceNumber', 'text')}
          {renderField(t('eventCertificate.fields.bestLapTime'), 'bestLapTime', 'text')}
        </div>
      );
    case 'auction':
      return (
        <div className="bg-white shadow-md rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold">Details</h2>
          {renderField(t('eventCertificate.fields.auctionHouse'), 'auctionHouse', 'text', false)}
          {renderField(t('eventCertificate.fields.participantName'), 'participantName', 'text')}
          {renderField(t('eventCertificate.fields.lotNumber'), 'lotNumber', 'text')}
          {renderField(t('eventCertificate.fields.saleStatus'), 'saleStatus', 'text')}
        </div>
      );
    case 'workshop':
      return (
        <div className="bg-white shadow-md rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold">Details</h2>
          {renderField(t('eventCertificate.fields.workshopTopic'), 'workshopTopic', 'text', false)}
          {renderField(t('eventCertificate.fields.instructorName'), 'instructorName', 'text')}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={((metadata as any)['completionAcknowledgment'] as boolean) || false}
                onChange={(e) => onChange('completionAcknowledgment', e.target.checked)}
                className="w-4 h-4 border border-border rounded cursor-pointer"
              />
              <span className="text-sm font-medium">{t('eventCertificate.fields.completionAcknowledgment')}</span>
            </label>
          </div>
        </div>
      );
    case 'club_competition':
      return (
        <div className="bg-white shadow-md rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold">Details</h2>
          {renderField(t('eventCertificate.fields.competitionCategory'), 'competitionCategory', 'text', false)}
          {renderField(t('eventCertificate.fields.awardTitle'), 'awardTitle', 'text', false)}
          {renderField(t('eventCertificate.fields.clubChapter'), 'clubChapter', 'text')}
        </div>
      );
    case 'road_trip':
      return (
        <div className="bg-white shadow-md rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold">Details</h2>
          {renderField(t('eventCertificate.fields.routeName'), 'routeName', 'text', false)}
          {renderField(t('eventCertificate.fields.totalDistance'), 'totalDistance', 'number')}
          {renderField(t('eventCertificate.fields.dateRange'), 'dateRange', 'text')}
        </div>
      );
    case 'festival':
      return (
        <div className="bg-white shadow-md rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold">Details</h2>
          {renderField(t('eventCertificate.fields.festivalTheme'), 'festivalTheme', 'text', false)}
        </div>
      );
    default:
      return null;
  }
}
