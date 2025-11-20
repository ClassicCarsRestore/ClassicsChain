import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Car, Plus, Gift, Check } from 'lucide-react';
import { api } from '@/lib/api';
import type { Vehicle, VehicleListResponse } from '@/types/vehicle';
import type { InvitationVehicle } from '@/types/user';

export function DashboardPage() {
  const { t } = useTranslation('dashboard');
  const { session, userProfile, refreshSession } = useAuth();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaimingInvitations, setIsClaimingInvitations] = useState(false);
  const [claimedVehicles, setClaimedVehicles] = useState<InvitationVehicle[]>([]);

  const userEmail = session?.identity?.traits?.email as string | undefined;
  const nameObj = session?.identity?.traits?.name as { first?: string; last?: string } | undefined;
  const userName = nameObj?.first
    ? `${nameObj.first}${nameObj.last ? ` ${nameObj.last}` : ''}`
    : undefined;

  useEffect(() => {
    const fetchVehicles = async () => {
      if (!userProfile?.id) return;

      try {
        setIsLoading(true);
        const response = await api.get<VehicleListResponse>(
          `/v1/vehicles?ownerId=${userProfile.id}`
        );
        setVehicles(response.data);
      } catch (error) {
        console.error('Failed to fetch vehicles:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVehicles();
  }, [userProfile?.id]);

  const handleClaimInvitations = async () => {
    try {
      setIsClaimingInvitations(true);
      const response = await api.post<{ claimedVehicles: InvitationVehicle[]; count: number }>(
        '/v1/invitations/claim'
      );

      if (response?.claimedVehicles && response.claimedVehicles.length > 0) {
        setClaimedVehicles(response.claimedVehicles);
        // Refresh the session to update pending invitations count
        await refreshSession();
        // Refresh vehicles list to show the newly claimed vehicles
        if (userProfile?.id) {
          const vehiclesResponse = await api.get<VehicleListResponse>(
            `/v1/vehicles?ownerId=${userProfile.id}`
          );
          setVehicles(vehiclesResponse.data);
        }
      }
    } catch (error) {
      console.error('Failed to claim invitations:', error);
    } finally {
      setIsClaimingInvitations(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          {userName ? t('welcomeWithName', { name: userName }) : t('welcome')}
        </h1>
        <p className="mt-2 text-muted-foreground">{userEmail}</p>
      </div>

      {/* Pending Invitations CTA */}
      {userProfile && userProfile.pendingInvitations && userProfile.pendingInvitations.count > 0 && !claimedVehicles.length && (
        <div className="mb-8 rounded-lg border border-amber-200 bg-amber-50 p-6 dark:border-amber-900 dark:bg-amber-950/30">
          <div className="flex items-start gap-4">
            <Gift className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                {userProfile.pendingInvitations?.count} Vehicle{userProfile.pendingInvitations?.count !== 1 ? 's' : ''} Awaiting Claim
              </h3>
              <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
                {userProfile.pendingInvitations?.vehicles.map(v => `${v.make} ${v.model}`).join(', ')}
              </p>
              <button
                onClick={handleClaimInvitations}
                disabled={isClaimingInvitations}
                className="mt-4 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-50 dark:bg-amber-700 dark:hover:bg-amber-800"
              >
                {isClaimingInvitations ? 'Claiming...' : 'Claim Vehicles'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Claimed Success Message */}
      {claimedVehicles.length > 0 && (
        <div className="mb-8 rounded-lg border border-green-200 bg-green-50 p-6 dark:border-green-900 dark:bg-green-950/30">
          <div className="flex items-start gap-4">
            <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
            <div className="flex-1">
              <h3 className="font-semibold text-green-900 dark:text-green-100">
                Successfully Claimed {claimedVehicles.length} Vehicle{claimedVehicles.length !== 1 ? 's' : ''}
              </h3>
              <p className="mt-1 text-sm text-green-800 dark:text-green-200">
                {claimedVehicles.map(v => `${v.make} ${v.model}`).join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <button
          onClick={() => navigate('/vehicles/new')}
          className="flex items-center gap-4 rounded-lg border border-border bg-card p-6 text-left transition-colors hover:bg-accent cursor-pointer"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Plus className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{t('actions.addVehicle')}</h3>
            <p className="text-sm text-muted-foreground">{t('actions.addVehicleDescription')}</p>
          </div>
        </button>
      </div>

      {/* Vehicles Section */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">{t('vehicles.title')}</h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading vehicles...</p>
          </div>
        ) : vehicles.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <Car className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-foreground">
              {t('vehicles.empty.title')}
            </h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              {t('vehicles.empty.description')}
            </p>
            <button
              onClick={() => navigate('/vehicles/new')}
              className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t('vehicles.empty.action')}
            </button>
          </div>
        ) : (
          /* Vehicle List */
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((vehicle) => (
              <button
                key={vehicle.id}
                onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                className="cursor-pointer rounded-lg border border-border bg-background p-4 text-left transition-colors hover:bg-accent"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Car className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h3 className="font-semibold text-foreground">
                      {vehicle.make} {vehicle.model}
                    </h3>
                    <p className="text-sm text-muted-foreground">{vehicle.year}</p>
                    {vehicle.color && (
                      <p className="mt-1 text-xs text-muted-foreground">{vehicle.color}</p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
