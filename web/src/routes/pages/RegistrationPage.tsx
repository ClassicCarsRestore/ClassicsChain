import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { RegistrationFlow, UpdateRegistrationFlowBody } from '@ory/client';
import { kratos } from '@/lib/kratos';
import { useAuth } from '@/contexts/AuthContext';
import { PasswordInput } from '@/components/Auth/PasswordInput';
import { api } from '@/lib/api';

interface InvitationData {
  email: string;
  vehicles: Array<{
    vehicleId: string;
    make?: string;
    model?: string;
    year?: number;
    licensePlate?: string;
  }>;
}

export function RegistrationPage() {
  const [flow, setFlow] = useState<RegistrationFlow | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, refreshSession } = useAuth();

  const invitationToken = searchParams.get('invitation');
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);
  const [loadingInvitation, setLoadingInvitation] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
      return;
    }

    // If there's an invitation token, validate it first
    if (invitationToken && !invitationData) {
      validateInvitation();
      return;
    }

    const flowId = searchParams.get('flow');

    if (flowId) {
      kratos
        .getRegistrationFlow({ id: flowId })
        .then(({ data }) => setFlow(data))
        .catch((err) => {
          console.error('Error fetching registration flow:', err);
          createNewFlow();
        });
    } else {
      createNewFlow();
    }
  }, [searchParams, isAuthenticated, navigate, invitationToken, invitationData]);

  const validateInvitation = async () => {
    setLoadingInvitation(true);
    try {
      const data = await api.get<InvitationData>(`/v1/invitations/validate?token=${encodeURIComponent(invitationToken!)}`);
      setInvitationData(data);

      // After validation, create the flow
      const flowId = searchParams.get('flow');
      if (flowId) {
        kratos
          .getRegistrationFlow({ id: flowId })
          .then(({ data }) => setFlow(data))
          .catch(() => createNewFlow());
      } else {
        createNewFlow();
      }
    } catch (err) {
      console.error('Failed to validate invitation:', err);
      setError('Invalid or expired invitation. Please contact support.');
    } finally {
      setLoadingInvitation(false);
    }
  };

  const createNewFlow = () => {
    kratos
      .createBrowserRegistrationFlow()
      .then(({ data }) => {
        setFlow(data);
        navigate(`/registration?flow=${data.id}`, { replace: true });
      })
      .catch((err) => {
        console.error('Error creating registration flow:', err);
        setError('Failed to initialize registration. Please try again.');
      });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!flow) return;

    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const body: UpdateRegistrationFlowBody = {
      method: 'password',
      traits: {
        email,
      },
      password,
      csrf_token: (flow.ui.nodes.find((node) => node.attributes.node_type === 'input' && (node.attributes as any)?.name === 'csrf_token')?.attributes as any)?.value as string,
    };

    try {
      await kratos.updateRegistrationFlow({
        flow: flow.id,
        updateRegistrationFlowBody: body,
      });

      await refreshSession();
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setIsLoading(false);

      if (err.response?.status === 400) {
        const flowData = err.response.data as RegistrationFlow;
        setFlow(flowData);

        const messages = flowData.ui.messages || [];
        if (messages.length > 0) {
          setError(messages[0].text);
        } else {
          setError('Registration failed. Please check your input and try again.');
        }
      } else if (err.response?.status === 410) {
        createNewFlow();
      } else {
        setError('An error occurred during registration. Please try again.');
        console.error('Registration error:', err);
      }
    }
  };

  if (!flow || loadingInvitation) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">
            {loadingInvitation ? 'Validating invitation...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <div className="w-full max-w-md p-8 bg-gradient-to-br from-card to-card/50 rounded-lg border border-border shadow-[0_10px_40px_rgba(0,0,0,0.3)]">
        <h1 className="text-2xl font-bold text-center mb-6 text-foreground" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>Create Account</h1>

        {flow.ui.messages?.map((message, idx) => (
          <div
            key={idx}
            className={`mb-4 p-3 rounded text-sm border ${
              message.type === 'error'
                ? 'bg-red-950/20 border-red-900/50 text-red-400'
                : 'bg-blue-950/20 border-blue-900/50 text-blue-400'
            }`}
          >
            {message.text}
          </div>
        ))}

        {error && !flow.ui.messages?.length && (
          <div className="mb-4 p-3 bg-red-950/20 border border-red-900/50 rounded text-red-400 text-sm">
            {error}
          </div>
        )}

        {invitationData && (
          <div className="mb-6 p-4 bg-blue-950/20 border border-blue-900/50 rounded-md">
            <p className="text-blue-400 text-sm">
              Creating account for invitation to manage {invitationData.vehicles.length} vehicle{invitationData.vehicles.length > 1 ? 's' : ''}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              autoComplete="email"
              defaultValue={invitationData?.email || ''}
              readOnly={!!invitationData}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors disabled:opacity-50 read-only:opacity-70 read-only:cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
              Password
            </label>
            <PasswordInput
              id="password"
              name="password"
              required
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {isLoading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <a href="/login" className="text-primary hover:text-primary/80 transition-colors cursor-pointer">
            Sign in
          </a>
        </div>
      </div>
    </div>
  );
}
