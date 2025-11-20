import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { EventCertificateFormFields } from '@/features/certifications/components/EventCertificateFormFields';
import { useCreateBulkEvents } from '@/features/certifications/hooks/useBulkEvents';
import type { EventType, EventMetadata } from '@/features/certifications/types';
import type { VehicleIdentifier } from '@/features/certifications/hooks/useBulkEvents';

export function BulkCertificatesPage() {
  const { t } = useTranslation('vehicles');
  const { getUserEntities } = useAuth();
  const [selectedEventType, setSelectedEventType] = useState<EventType | ''>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('');
  const [metadata, setMetadata] = useState<EventMetadata | null>(null);
  const [vehicles, setVehicles] = useState<VehicleIdentifier[]>([
    { chassisNumber: '', licensePlate: '', email: '' },
  ]);
  const [results, setResults] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);

  const { mutate: createBulkEvents, isPending } = useCreateBulkEvents();
  const userEntities = getUserEntities();
  const entityId = userEntities[0]?.entityId;

  useEffect(() => {
    if (selectedEventType) {
      initializeMetadata(selectedEventType as any);
    }
  }, [selectedEventType]);

  const initializeMetadata = (eventType: EventType) => {
    // Reuse the same initialization logic from EventCertificateForm
    switch (eventType) {
      case 'car_show':
        setMetadata({
          category: '',
          award: '',
        } as any);
        break;
      case 'classic_meet':
        setMetadata({
          clubName: '',
          theme: '',
        } as any);
        break;
      case 'rally':
        setMetadata({
          route: '',
          carNumber: '',
          coDriver: '',
        } as any);
        break;
      case 'vintage_racing':
        setMetadata({
          trackName: '',
          raceClass: '',
          raceNumber: '',
          bestLapTime: '',
        } as any);
        break;
      case 'auction':
        setMetadata({
          auctionHouse: '',
          participantName: '',
          lotNumber: '',
          saleStatus: '',
        } as any);
        break;
      case 'workshop':
        setMetadata({
          workshopTopic: '',
          instructorName: '',
          completionAcknowledgment: false,
        } as any);
        break;
      case 'club_competition':
        setMetadata({
          competitionCategory: '',
          awardTitle: '',
          clubChapter: '',
        } as any);
        break;
      case 'road_trip':
        setMetadata({
          routeName: '',
          totalDistance: undefined,
          checkpointsCompleted: [],
          dateRange: '',
        } as any);
        break;
      case 'festival':
        setMetadata({
          festivalTheme: '',
          activitiesParticipatedIn: [],
        } as any);
        break;
      default:
        setMetadata({} as any);
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

  const handleAddVehicle = () => {
    setVehicles([
      ...vehicles,
      { chassisNumber: '', licensePlate: '', email: '' },
    ]);
  };

  const handleRemoveVehicle = (index: number) => {
    setVehicles(vehicles.filter((_, i) => i !== index));
  };

  const handleVehicleChange = (index: number, field: 'chassisNumber' | 'licensePlate' | 'email', value: string) => {
    const updated = [...vehicles];
    updated[index] = {
      ...updated[index],
      [field]: value || undefined,
    };
    setVehicles(updated);
  };

  const handlePasteVehicles = async (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text');
    const lines = text.split('\n').filter((line) => line.trim());

    const parsed: VehicleIdentifier[] = lines.map((line) => {
      const parts = line.split('|').map((p) => p.trim());
      return {
        chassisNumber: parts[0] || undefined,
        licensePlate: parts[1] || undefined,
        email: parts[2] || undefined,
      };
    });

    setVehicles(parsed);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEventType || !metadata) {
      alert('Please fill in all required fields');
      return;
    }
    if (vehicles.length === 0 || vehicles.every((v) => !v.chassisNumber && !v.licensePlate)) {
      alert('Please add at least one vehicle');
      return;
    }

    // Filter out empty vehicles and validate
    const validVehicles = vehicles.filter((v) => v.chassisNumber || v.licensePlate);

    createBulkEvents(
      {
        entityId,
        type: selectedEventType as EventType,
        title: title || selectedEventType.replace(/_/g, ' '),
        description,
        date: new Date(eventDate),
        location: location || undefined,
        metadata: metadata as any,
        vehicles: validVehicles,
      },
      {
        onSuccess: (response) => {
          console.log('Bulk events created successfully', response);
          setResults(response);
          setShowResults(true);
        },
        onError: (error) => {
          console.error('Failed to create bulk events', error);
          alert(`Error: ${error instanceof Error ? error.message : 'Failed to issue certificates'}`);
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">{t('bulkCertificates.title')}</h1>
        <p className="text-muted-foreground">{t('bulkCertificates.description')}</p>
      </div>

      {!showResults ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event Type Selection */}
          <div className="bg-white shadow-md rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold">{t('bulkCertificates.section.eventType')}</h2>
            <select
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value as any)}
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
              {/* Common Event Fields */}
              <div className="bg-white shadow-md rounded-lg p-6 space-y-4">
                <h2 className="text-lg font-semibold">{t('bulkCertificates.section.eventDetails')}</h2>

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
              {metadata && (
                <EventCertificateFormFields
                  eventType={selectedEventType as any}
                  metadata={metadata}
                  onChange={handleMetadataChange}
                />
              )}

              {/* Vehicle List */}
              <div className="bg-white shadow-md rounded-lg p-6 space-y-4">
                <h2 className="text-lg font-semibold">{t('bulkCertificates.section.vehicles')}</h2>
                <p className="text-sm text-muted-foreground">{t('bulkCertificates.hint.vehicleFormat')}</p>

                <div className="space-y-3">
                  {vehicles.map((vehicle, index) => (
                    <div key={index} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="block text-xs font-medium mb-1 text-muted-foreground">
                          {t('bulkCertificates.fields.chassis')}
                        </label>
                        <input
                          type="text"
                          value={vehicle.chassisNumber || ''}
                          onChange={(e) => handleVehicleChange(index, 'chassisNumber', e.target.value)}
                          placeholder="Chassis number"
                          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium mb-1 text-muted-foreground">
                          {t('bulkCertificates.fields.licensePlate')}
                        </label>
                        <input
                          type="text"
                          value={vehicle.licensePlate || ''}
                          onChange={(e) => handleVehicleChange(index, 'licensePlate', e.target.value)}
                          placeholder="License plate"
                          onPaste={handlePasteVehicles}
                          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium mb-1 text-muted-foreground">
                          {t('bulkCertificates.fields.email')}
                        </label>
                        <input
                          type="email"
                          value={vehicle.email || ''}
                          onChange={(e) => handleVehicleChange(index, 'email', e.target.value)}
                          placeholder="Email (optional)"
                          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      {vehicles.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveVehicle(index)}
                          className="p-2 text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddVehicle}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-md transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  {t('bulkCertificates.actions.addVehicle')}
                </button>
              </div>

              {/* Submit Button */}
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={isPending || vehicles.length === 0}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isPending ? t('bulkCertificates.actions.issuing') : t('bulkCertificates.actions.issue')}
                </button>
              </div>
            </>
          )}
        </form>
      ) : (
        /* Results Display */
        <div className="space-y-6">
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              {(results?.errors?.length ?? 0) === 0 ? (
                <CheckCircle className="w-6 h-6 text-green-500" />
              ) : (
                <AlertCircle className="w-6 h-6 text-yellow-500" />
              )}
              <h2 className="text-lg font-semibold">
                {(results?.errors?.length ?? 0) === 0
                  ? t('bulkCertificates.results.allSuccess')
                  : t('bulkCertificates.results.partialSuccess')}
              </h2>
            </div>

            <div className="space-y-2 text-sm mb-4">
              <p>
                <span className="font-medium text-green-600">✓ {results?.success?.length ?? 0}</span>{' '}
                {t('bulkCertificates.results.certificatesIssued')}
              </p>
              {(results?.errors?.length ?? 0) > 0 && (
                <p>
                  <span className="font-medium text-red-600">✗ {results?.errors?.length ?? 0}</span>{' '}
                  {t('bulkCertificates.results.certificatesFailed')}
                </p>
              )}
            </div>
          </div>

          {/* Success List */}
          {(results?.success?.length ?? 0) > 0 && (
            <div className="bg-white shadow-md rounded-lg p-6">
              <h3 className="font-semibold mb-3 text-green-700">{t('bulkCertificates.results.successList')}</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {results?.success?.map((item: any, index: number) => (
                  <div key={index} className="flex items-center gap-2 text-sm p-2 bg-green-50 rounded">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="font-mono text-xs flex-1">{item.vehicleId}</span>
                    {item.created && (
                      <span className="px-2 py-1 text-xs bg-green-200 text-green-800 rounded">New</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error List */}
          {(results?.errors?.length ?? 0) > 0 && (
            <div className="bg-white shadow-md rounded-lg p-6 border border-red-300">
              <h3 className="font-semibold mb-3 text-destructive">{t('bulkCertificates.results.errorList')}</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {results?.errors?.map((item: any, index: number) => (
                  <div key={index} className="flex items-start gap-2 text-sm p-2 bg-red-50 rounded">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-mono text-xs">
                        {item.chassisNumber || item.licensePlate || 'Unknown'}
                      </p>
                      <p className="text-xs text-red-600">{item.error}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <button
              onClick={() => {
                setShowResults(false);
                setTitle('');
                setDescription('');
                setLocation('');
                setSelectedEventType('');
                setMetadata(null);
                setVehicles([{ chassisNumber: '', licensePlate: '', email: '' }]);
              }}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium"
            >
              {t('bulkCertificates.actions.issuMore')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
