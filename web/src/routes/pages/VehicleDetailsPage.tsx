import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Plus, FileText, Share2, Clock, Eye, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { Vehicle, Event, EventListResponse, CreateOwnerEventRequest } from '@/types/vehicle';
import { EventTimeline } from '@/components/vehicle/EventTimeline';
import { VehicleInfoCard } from '@/components/vehicle/VehicleInfoCard';
import { VehicleStats } from '@/components/vehicle/VehicleStats';
import { VehiclePassport } from '@/components/vehicle/VehiclePassport';
import { VehicleEventCreateModal } from '@/features/vehicles/components/VehicleEventCreateModal';
import { VehiclePhotosSection } from '@/features/vehicles';
import { VehicleDocumentsSection } from '@/features/vehicles/components/VehicleDocumentsSection';
import { ShareLinkModal } from '@/features/vehicles/components/ShareLinkModal';
import { ShareLinksList } from '@/features/vehicles/components/ShareLinksList';
import { useCreateShareLink } from '@/features/vehicles/hooks/useVehicleShareLinks';
import { eventsApi } from '@/features/vehicles/api/eventsApi';
import type { PhotoListResponse } from '@/features/vehicles/types/photo';
import type { DocumentListResponse } from '@/features/vehicles/types/document';

export function VehicleDetailsPage() {
  const { t } = useTranslation('vehicle');
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoadingVehicle, setIsLoadingVehicle] = useState(true);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isPassportOpen, setIsPassportOpen] = useState(false);
  const createShareLink = useCreateShareLink(vehicleId || '');

  const { data: photosData } = useQuery({
    queryKey: ['vehicle-photos-count', vehicleId],
    queryFn: async () => {
      const response = await api.get<PhotoListResponse>(`/v1/vehicles/${vehicleId}/photos`);
      return response.data || [];
    },
    enabled: !!vehicleId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: documentsData } = useQuery({
    queryKey: ['vehicle-documents-count', vehicleId],
    queryFn: async () => {
      const response = await api.get<DocumentListResponse>(`/v1/vehicles/${vehicleId}/documents`);
      return response.data || [];
    },
    enabled: !!vehicleId,
    staleTime: 5 * 60 * 1000,
  });

  const vehicleStats = useMemo(() => {
    const anchoredEvents = events.filter(e => !!e.blockchainTxId).length;
    const earliestEvent = events.length > 0
      ? events.reduce((earliest, event) =>
          new Date(event.date) < new Date(earliest.date) ? event : earliest
        )
      : null;

    return {
      totalEvents: events.length,
      anchoredEvents,
      photosCount: photosData?.length || 0,
      documentsCount: documentsData?.length || 0,
      earliestEventDate: earliestEvent?.date,
      hasVerifiedEvents: anchoredEvents > 0,
    };
  }, [events, photosData, documentsData]);

  // Fetch vehicle details
  useEffect(() => {
    const fetchVehicle = async () => {
      if (!vehicleId) return;

      try {
        setIsLoadingVehicle(true);
        const response = await api.get<Vehicle>(`/v1/vehicles/${vehicleId}`);
        setVehicle(response);
      } catch (err) {
        console.error('Failed to fetch vehicle:', err);
        setError(t('vehicle:error.notFound'));
      } finally {
        setIsLoadingVehicle(false);
      }
    };

    fetchVehicle();
  }, [vehicleId, t]);

  // Fetch vehicle events
  useEffect(() => {
    const fetchEvents = async () => {
      if (!vehicleId) return;

      try {
        setIsLoadingEvents(true);
        const response = await api.get<EventListResponse>(
          `/v1/vehicles/${vehicleId}/events?limit=100`
        );
        // Sort events by date, most recent first
        const sortedEvents = (response.data || []).sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setEvents(sortedEvents);
      } catch (err) {
        console.error('Failed to fetch events:', err);
      } finally {
        setIsLoadingEvents(false);
      }
    };

    fetchEvents();
  }, [vehicleId]);

  const handleCreateEvent = async (eventData: CreateOwnerEventRequest) => {
    try {
      setIsSubmittingEvent(true);
      if (!vehicleId) {
        throw new Error('Vehicle ID is required');
      }

      await eventsApi.createOwnerEvent(vehicleId, eventData);

      // Refresh events
      const response = await api.get<EventListResponse>(
        `/v1/vehicles/${vehicleId}/events?limit=100`
      );
      const sortedEvents = (response.data || []).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setEvents(sortedEvents);
    } catch (err) {
      console.error('Failed to create event:', err);
      throw err;
    } finally {
      setIsSubmittingEvent(false);
    }
  };

  if (isLoadingVehicle) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">{t('vehicle:loading')}</p>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="mx-auto max-w-4xl">
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-4 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('vehicle:buttons.backToDashboard')}
        </button>
        <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-foreground">{error || t('vehicle:error.notFound')}</p>
        </div>
      </div>
    );
  }

  const isCertified = (event: Event) => {
    return !!event.entityId;
  };

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('vehicle:buttons.backToDashboard')}
          </button>
          <button
            onClick={() => setIsPassportOpen(true)}
            className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:border-primary/50 cursor-pointer"
          >
            <Eye className="h-4 w-4" />
            {t('vehicle:passport.previewButton')}
          </button>
        </div>
        <VehicleInfoCard vehicle={vehicle} hasVerifiedEvents={vehicleStats.hasVerifiedEvents} />
      </div>

      {/* Quick Stats */}
      {!isLoadingEvents && (
        <VehicleStats
          totalEvents={vehicleStats.totalEvents}
          anchoredEvents={vehicleStats.anchoredEvents}
          photosCount={vehicleStats.photosCount}
          documentsCount={vehicleStats.documentsCount}
          earliestEventDate={vehicleStats.earliestEventDate}
        />
      )}

      {/* Photos Section */}
      <div className="mb-8">
        <VehiclePhotosSection vehicleId={vehicle.id} isOwner={vehicle.ownerId === userProfile?.id} />
      </div>

      {/* Documents Section */}
      <div className="mb-8">
        <VehicleDocumentsSection vehicleId={vehicle.id} isOwner={vehicle.ownerId === userProfile?.id} />
      </div>

      {/* Share Links Section */}
      {vehicle.ownerId === userProfile?.id && (
        <div className="mb-8 rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">
              <Share2 className="h-5 w-5 text-primary" />
              {t('vehicle:sections.shareLinks')}
            </h2>
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 cursor-pointer"
            >
              <Share2 className="h-4 w-4" />
              {t('vehicle:shareLinks.createButton')}
            </button>
          </div>
          <ShareLinksList vehicleId={vehicle.id} />
        </div>
      )}

      {/* Events/History Section */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">
            <Clock className="h-5 w-5 text-primary" />
            {t('vehicle:sections.history')}
          </h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            {t('vehicle:buttons.addEvent')}
          </button>
        </div>

        {isLoadingEvents ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">{t('vehicle:loading')}</p>
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-3 text-sm font-medium text-foreground">{t('vehicle:events.empty.title')}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t('vehicle:events.empty.description')}</p>
          </div>
        ) : (
          <EventTimeline events={events} isCertified={isCertified} />
        )}
      </div>

      {/* Share Link Create Modal */}
      <ShareLinkModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onSubmit={async (data) => {
          await createShareLink.mutateAsync(data);
          setIsShareModalOpen(false);
        }}
        isSubmitting={createShareLink.isPending}
      />

      {/* Event Create Modal */}
      <VehicleEventCreateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateEvent}
        vehicleId={vehicle.id}
        isSubmitting={isSubmittingEvent}
      />

      {/* Passport Preview Overlay */}
      {isPassportOpen && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-y-auto">
          <div className="container mx-auto max-w-3xl px-4 py-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">{t('vehicle:passport.previewButton')}</h2>
              <button
                onClick={() => setIsPassportOpen(false)}
                className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:border-primary/50 cursor-pointer"
              >
                <X className="h-4 w-4" />
                {t('vehicle:passport.closePreview')}
              </button>
            </div>
            <VehiclePassport
              vehicle={vehicle}
              photos={photosData}
              documents={documentsData}
              events={events}
              showPhotos={(photosData?.length ?? 0) > 0}
              showDocuments={(documentsData?.length ?? 0) > 0}
              showHistory={events.length > 0}
            />
          </div>
        </div>
      )}
    </div>
  );
}
