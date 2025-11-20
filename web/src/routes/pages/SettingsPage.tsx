import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { SettingsFlow, UpdateSettingsFlowBody } from '@ory/client';
import { kratos } from '@/lib/kratos';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Shield } from 'lucide-react';
import { TotpSetup } from '@/components/MfaSettings/TotpSetup';

export function SettingsPage() {
  const [flow, setFlow] = useState<SettingsFlow | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, refreshSession, hasMFA } = useAuth();
  const [activeTab, setActiveTab] = useState<'password' | 'mfa'>('password');
  const [showTotpSetup, setShowTotpSetup] = useState(false);

  useEffect(() => {
    const flowId = searchParams.get('flow');

    // If we have a flow ID (e.g., from recovery), try to fetch it directly
    // This handles the case where the user just completed recovery and has a session
    if (flowId) {
      kratos
        .getSettingsFlow({ id: flowId })
        .then(({ data }) => setFlow(data))
        .catch((err) => {
          console.error('Error fetching settings flow:', err);
          // If flow fetch fails and not authenticated, redirect to login
          if (!isAuthenticated) {
            navigate('/login', { replace: true });
          } else {
            createNewFlow();
          }
        });
    } else if (!isAuthenticated) {
      // Only redirect to login if no flow ID and not authenticated
      navigate('/login', { replace: true });
    } else {
      // Authenticated but no flow ID, create new flow
      createNewFlow();
    }
  }, [searchParams, isAuthenticated, navigate]);

  const createNewFlow = () => {
    kratos
      .createBrowserSettingsFlow()
      .then(({ data }) => {
        setFlow(data);
        navigate(`/settings?flow=${data.id}`, { replace: true });
      })
      .catch((err) => {
        console.error('Error creating settings flow:', err);
        setError('Failed to initialize settings. Please try again.');
      });
  };

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!flow || !flow.ui?.nodes) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;

    const body: UpdateSettingsFlowBody = {
      method: 'password',
      password,
      csrf_token: (flow.ui.nodes.find(
        (node) => (node.attributes as any)?.name === 'csrf_token'
      )?.attributes as any)?.value as string,
    };

    try {
      await kratos.updateSettingsFlow({
        flow: flow.id,
        updateSettingsFlowBody: body,
      });

      setSuccess('Password updated successfully!');
      setIsLoading(false);

      // Reset form
      (e.target as HTMLFormElement).reset();

      // Refresh the session to ensure AuthContext is updated
      await refreshSession();

      // Redirect after a short delay
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1000);
    } catch (err: any) {
      setIsLoading(false);

      if (err.response?.status === 400) {
        const flowData = err.response.data as SettingsFlow;
        setFlow(flowData);

        const messages = flowData.ui?.messages || [];
        if (messages.length > 0) {
          setError(messages[0].text);
        } else {
          setError('Failed to update password. Please check your input and try again.');
        }
      } else if (err.response?.status === 410) {
        createNewFlow();
      } else if (err.response?.status === 403) {
        setError('Session expired or insufficient privileges. Please log in again.');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError('An error occurred while updating settings. Please try again.');
        console.error('Settings error:', err);
      }
    }
  };

  const handleTotpSetupClick = () => {
    setError('');
    setSuccess('');
    setShowTotpSetup(true);
  };

  const handleTotpSetupSuccess = () => {
    setShowTotpSetup(false);
    setSuccess('Two-factor authentication has been successfully enabled!');
    refreshSession();
  };

  const handleDisableTOTP = async () => {
    if (!flow || !flow.ui?.nodes || !window.confirm('Are you sure you want to disable two-factor authentication?')) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    const body: UpdateSettingsFlowBody = {
      method: 'totp',
      totp_unlink: true,
      csrf_token: (flow.ui.nodes.find(
        (node) => (node.attributes as any)?.name === 'csrf_token'
      )?.attributes as any)?.value as string,
    };

    try {
      await kratos.updateSettingsFlow({
        flow: flow.id,
        updateSettingsFlowBody: body,
      });

      setSuccess('Two-factor authentication has been disabled.');
      setIsLoading(false);
      await refreshSession();
      createNewFlow();
    } catch (err: any) {
      setIsLoading(false);
      const errorMsg = err.response?.data?.ui?.messages?.[0]?.text || 'Failed to disable two-factor authentication';
      setError(errorMsg);
    }
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
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-4 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold text-foreground">Account Settings</h1>
        <p className="mt-2 text-muted-foreground">Manage your account preferences and security</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-4 border-b border-border">
        <button
          onClick={() => setActiveTab('password')}
          className={`pb-2 px-4 font-medium transition-colors ${
            activeTab === 'password'
              ? 'border-b-2 border-primary text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Password
        </button>
        <button
          onClick={() => setActiveTab('mfa')}
          className={`pb-2 px-4 font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'mfa'
              ? 'border-b-2 border-primary text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Shield className="h-4 w-4" />
          Two-Factor Authentication
        </button>
      </div>

      {/* Messages */}
      {flow.ui?.messages?.map((message, idx) => (
        <div
          key={idx}
          className={`mb-4 p-3 rounded text-sm border ${
            message.type === 'error'
              ? 'bg-red-950/20 border-red-900/50 text-red-400'
              : message.type === 'success'
              ? 'bg-green-950/20 border-green-900/50 text-green-400'
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

      {success && (
        <div className="mb-4 p-3 bg-green-950/20 border border-green-900/50 rounded text-green-400 text-sm">
          {success}
        </div>
      )}

      {/* Settings Card */}
      <div className="rounded-lg border border-border bg-card p-6">
        {activeTab === 'password' && (
          <form onSubmit={handlePasswordChange} className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">Change Password</h2>

              <div className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    required
                    autoComplete="new-password"
                    minLength={8}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Password must be at least 8 characters long
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}

        {activeTab === 'mfa' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">Two-Factor Authentication (TOTP)</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Add an extra layer of security to your account by enabling two-factor authentication with an authenticator app.
              </p>

              {showTotpSetup && flow ? (
                <TotpSetup
                  flowId={flow.id}
                  onSuccess={handleTotpSetupSuccess}
                  onError={(err) => {
                    setError(err.message);
                    setShowTotpSetup(false);
                  }}
                />
              ) : (
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg border ${
                    hasMFA()
                      ? 'bg-green-950/10 border-green-900/30'
                      : 'bg-blue-950/10 border-blue-900/30'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">
                          {hasMFA() ? 'Two-Factor Authentication Enabled' : 'Two-Factor Authentication Disabled'}
                        </p>
                        <p className={`text-sm mt-1 ${
                          hasMFA() ? 'text-green-400' : 'text-blue-400'
                        }`}>
                          {hasMFA()
                            ? 'Your account is protected with TOTP-based two-factor authentication'
                            : 'Set up two-factor authentication to protect your account'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    {!hasMFA() ? (
                      <button
                        onClick={handleTotpSetupClick}
                        disabled={isLoading}
                        className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md font-medium disabled:opacity-50"
                      >
                        Enable Two-Factor Authentication
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={handleTotpSetupClick}
                          disabled={isLoading}
                          className="px-4 py-2 border border-border hover:bg-muted rounded-md font-medium disabled:opacity-50"
                        >
                          Reset Authenticator
                        </button>
                        <button
                          onClick={handleDisableTOTP}
                          disabled={isLoading}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium disabled:opacity-50"
                        >
                          Disable Two-Factor
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
