import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';

interface Vehicle {
  vehicleId: string;
  make?: string;
  model?: string;
  year?: number;
  licensePlate?: string;
}

interface InvitationData {
  email: string;
  vehicles: Vehicle[];
}

export function InvitationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('invitation');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Invitation token not provided. Please check your invitation link.');
      setIsLoading(false);
      return;
    }

    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await api.get<InvitationData>(`/v1/invitations/validate?token=${encodeURIComponent(token!)}`);
      setInvitationData(response);
      setIsLoading(false);
    } catch (err: any) {
      console.error('Failed to validate invitation:', err);
      if (err.response?.status === 404) {
        setError('This invitation link is invalid or has expired.');
      } else {
        setError('Failed to validate invitation. Please try again.');
      }
      setIsLoading(false);
    }
  };

  const handleProceedToRegistration = () => {
    navigate(`/registration?invitation=${token}`);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/80 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 bg-gradient-to-br from-card to-card/50 rounded-lg border border-border/50 shadow-2xl">
          <h1 className="text-2xl font-bold text-foreground mb-2">Invalid Invitation</h1>
          <p className="text-foreground/70 mb-6">
            Invitation token not found in the URL. Please check your email and try again.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-2 px-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md font-medium transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/80 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 bg-gradient-to-br from-card to-card/50 rounded-lg border border-border/50 shadow-2xl">
          <h1 className="text-2xl font-bold text-foreground mb-2">Invitation Error</h1>
          <div className="mb-6 p-4 bg-red-950/20 border border-red-900/50 rounded-md">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-2 px-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md font-medium transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/80 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 bg-gradient-to-br from-card to-card/50 rounded-lg border border-border/50 shadow-2xl">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mb-4" />
            <p className="text-foreground/70 text-sm">Validating your invitation...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!invitationData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 flex items-center justify-center p-4">
      <div className="max-w-md w-full p-8 bg-gradient-to-br from-card to-card/50 rounded-lg border border-border/50 shadow-2xl">
        <h1 className="text-2xl font-bold text-foreground mb-2">Welcome to Classics Chain!</h1>
        <p className="text-foreground/70 mb-6">
          You've been invited to manage the following vehicle{invitationData.vehicles.length > 1 ? 's' : ''}:
        </p>

        <div className="mb-6 space-y-3">
          {invitationData.vehicles.map((vehicle) => (
            <div
              key={vehicle.vehicleId}
              className="p-4 bg-background/50 border border-border rounded-md"
            >
              <div className="font-medium text-foreground">
                {vehicle.make && vehicle.model ? (
                  <>
                    {vehicle.make} {vehicle.model}
                    {vehicle.year && ` (${vehicle.year})`}
                  </>
                ) : (
                  'Vehicle Details Pending'
                )}
              </div>
              {vehicle.licensePlate && (
                <div className="text-sm text-foreground/70 mt-1">
                  License Plate: {vehicle.licensePlate}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mb-6 p-4 bg-blue-950/20 border border-blue-900/50 rounded-md">
          <p className="text-blue-200 text-sm">
            Account will be created for: <strong className="text-blue-100">{invitationData.email}</strong>
          </p>
        </div>

        <button
          onClick={handleProceedToRegistration}
          className="w-full py-2 px-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md font-medium transition-colors"
        >
          Create Account
        </button>

        <div className="mt-4 text-center text-sm text-foreground/70">
          Already have an account?{' '}
          <a href="/login" className="text-primary hover:text-primary/80 transition-colors">
            Sign in
          </a>
        </div>
      </div>
    </div>
  );
}
