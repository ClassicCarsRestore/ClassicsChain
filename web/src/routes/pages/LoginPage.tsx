import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { LoginFlow, UpdateLoginFlowBody } from '@ory/client';
import { kratos } from '@/lib/kratos';
import { useAuth } from '@/contexts/AuthContext';
import { TotpChallenge } from '@/components/Auth/TotpChallenge';
import { BackupCodeChallenge } from '@/components/Auth/BackupCodeChallenge';
import { PasswordInput } from '@/components/Auth/PasswordInput';

export function LoginPage() {
  const [flow, setFlow] = useState<LoginFlow | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, refreshSession } = useAuth();
  const [currentChallenge, setCurrentChallenge] = useState<'password' | 'totp' | 'backup'>('password');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
      return;
    }

    const flowId = searchParams.get('flow');

    if (flowId) {
      kratos
        .getLoginFlow({ id: flowId })
        .then(({ data }) => {
          setFlow(data);
          // Check what challenge we're on
          if (data.ui?.nodes?.some(node => node.group === 'totp')) {
            setCurrentChallenge('totp');
          }
        })
        .catch((err) => {
          console.error('Error fetching login flow:', err);
          createNewFlow();
        });
    } else {
      createNewFlow();
    }
  }, [searchParams, isAuthenticated, navigate]);

  const createNewFlow = () => {
    const aal = searchParams.get('aal');
    kratos
      .createBrowserLoginFlow({
        refresh: searchParams.get('refresh') === 'true',
        aal: aal || undefined,
      })
      .then(({ data }) => {
        setFlow(data);
        navigate(`/login?flow=${data.id}`, { replace: true });
      })
      .catch((err) => {
        console.error('Error creating login flow:', err);
        setError('Failed to initialize login. Please try again.');
      });
  };

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!flow || !flow.ui?.nodes) return;

    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const identifier = formData.get('identifier') as string;
    const password = formData.get('password') as string;

    const csrfToken = (flow.ui.nodes.find(
      node => (node.attributes as any)?.name === 'csrf_token'
    )?.attributes as any)?.value || '';

    const body: UpdateLoginFlowBody = {
      method: 'password',
      identifier,
      password,
      csrf_token: csrfToken,
    };

    try {
      const { data: updatedFlow } = await kratos.updateLoginFlow({
        flow: flow.id,
        updateLoginFlowBody: body,
      });

      if ('ui' in updatedFlow) {
        setFlow(updatedFlow as any);

        // Check if TOTP is required
        if ((updatedFlow as any).ui?.nodes?.some((node: any) => node.group === 'totp')) {
          setCurrentChallenge('totp');
        } else {
          // Password only
          await refreshSession();
          navigate('/dashboard', { replace: true });
        }
      } else {
        // Login successful
        await refreshSession();
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      setIsLoading(false);

      if (err.response?.status === 400) {
        const flowData = err.response.data as LoginFlow;
        setFlow(flowData);
        const messages = flowData.ui?.messages || [];
        if (messages.length > 0) {
          setError(messages[0].text);
        } else {
          setError('Invalid credentials. Please try again.');
        }
      } else if (err.response?.status === 410) {
        createNewFlow();
      } else if (err.response?.status === 422) {
        // Browser location change required (AAL2 elevation needed)
        const redirectUrl = err.response.data?.redirect_browser_to;
        if (redirectUrl) {
          window.location.href = redirectUrl;
        } else {
          setError('A redirect is required to complete authentication.');
        }
      } else {
        setError('An error occurred during login. Please try again.');
        console.error('Login error:', err);
      }
    }
  };

  const handleTotpSuccess = async () => {
    await refreshSession();
    navigate('/dashboard', { replace: true });
  };

  if (!flow) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <div className="w-full max-w-md p-8 bg-gradient-to-br from-card to-card/50 rounded-lg border border-border shadow-[0_10px_40px_rgba(0,0,0,0.3)]">
        <h1 className="text-2xl font-bold text-center mb-6 text-foreground" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>Sign In</h1>

        {currentChallenge === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {flow.ui?.messages?.map((message, idx) => (
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

            {error && !flow.ui?.messages?.length && (
              <div className="mb-4 p-3 bg-red-950/20 border border-red-900/50 rounded text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-foreground mb-1">
                Email
              </label>
              <input
                type="text"
                id="identifier"
                name="identifier"
                required
                autoComplete="username"
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
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
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        )}

        {currentChallenge === 'totp' && (
          <TotpChallenge
            flow={flow}
            onSuccess={handleTotpSuccess}
            onBackupCodesClick={() => setCurrentChallenge('backup')}
          />
        )}

        {currentChallenge === 'backup' && (
          <BackupCodeChallenge
            flow={flow}
            onSuccess={handleTotpSuccess}
            onBackClick={() => setCurrentChallenge('totp')}
          />
        )}

        {currentChallenge === 'password' && (
          <div className="mt-4 text-center text-sm space-y-2 text-muted-foreground">
            <div>
              <a href="/recovery" className="text-primary hover:text-primary/80 transition-colors cursor-pointer">
                Forgot your password?
              </a>
            </div>
            <div>
              Don't have an account?{' '}
              <a href="/registration" className="text-primary hover:text-primary/80 transition-colors cursor-pointer">
                Register
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
