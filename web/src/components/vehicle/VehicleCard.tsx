import { useNavigate } from 'react-router-dom';
import { Car } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { generateStorageUrl } from '@/lib/storage';
import { VerificationBadge } from './VerificationBadge';
import { BrandLogo } from './BrandLogo';
import type { Vehicle, EventListResponse } from '@/types/vehicle';
import type { PhotoListResponse } from '@/features/vehicles/types/photo';

interface VehicleCardProps {
  vehicle: Vehicle;
}

export function VehicleCard({ vehicle }: VehicleCardProps) {
  const navigate = useNavigate();

  const { data: photos } = useQuery({
    queryKey: ['vehicle-photos-preview', vehicle.id],
    queryFn: async () => {
      const response = await api.get<PhotoListResponse>(`/v1/vehicles/${vehicle.id}/photos`);
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: events } = useQuery({
    queryKey: ['vehicle-events-preview', vehicle.id],
    queryFn: async () => {
      const response = await api.get<EventListResponse>(`/v1/vehicles/${vehicle.id}/events?limit=100`);
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const firstPhoto = photos?.[0];
  const hasVerifiedEvents = events?.some(event => !!event.blockchainTxId) ?? false;

  return (
    <button
      onClick={() => navigate(`/vehicles/${vehicle.id}`)}
      className="group cursor-pointer rounded-lg border border-border bg-background text-left transition-all hover:border-primary/50 hover:shadow-lg overflow-hidden"
    >
      {/* Hero Image or Placeholder */}
      <div className="aspect-[16/10] w-full bg-muted relative overflow-hidden">
        {firstPhoto ? (
          <img
            src={generateStorageUrl(firstPhoto.objectKey)}
            alt={`${vehicle.make} ${vehicle.model}`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Car className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}
        <div className="absolute bottom-2 right-2">
          <BrandLogo make={vehicle.make} size="md" />
        </div>
      </div>

      {/* Vehicle Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
              {vehicle.make} {vehicle.model}
            </h3>
            <p className="text-sm text-muted-foreground">{vehicle.year}</p>
          </div>
          {hasVerifiedEvents && (
            <VerificationBadge isVerified={true} size="sm" showLabel={false} />
          )}
        </div>
      </div>
    </button>
  );
}
