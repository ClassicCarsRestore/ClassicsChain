import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { RecoveryFlow, UpdateRecoveryFlowBody } from '@ory/client';
import { kratos } from '@/lib/kratos';
import { useAuth } from '@/contexts/AuthContext';

export function RecoveryPage() {
  const [flow, setFlow] = useState<RecoveryFlow | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
      return;
    }

    const flowId = searchParams.get('flow');

    if (flowId) {
      kratos
        .getRecoveryFlow({ id: flowId })
        .then(({ data }) => setFlow(data))
        .catch((err) => {
          console.error('Error fetching recovery flow:', err);
          createNewFlow();
        });
    } else {
      createNewFlow();
    }
  }, [searchParams, isAuthenticated, navigate]);

  const createNewFlow = () => {
    kratos
      .createBrowserRecoveryFlow()
      .then(({ data }) => {
        setFlow(data);
        navigate(`/recovery?flow=${data.id}`, { replace: true });
      })
      .catch((err) => {
        console.error('Error creating recovery flow:', err);
        setError('Failed to initialize recovery. Please try again.');
      });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!flow) return;

    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const code = formData.get('code') as string;

    // Determine if we're submitting email or code based on flow state
    const body: UpdateRecoveryFlowBody = code
      ? {
          method: 'code',
          code,
          csrf_token: (flow.ui.nodes.find(
            (node) => node.attributes.node_type === 'input' && (node.attributes as any)?.name === 'csrf_token'
          )?.attributes as any)?.value as string,
        }
      : {
          method: 'code',
          email,
          csrf_token: (flow.ui.nodes.find(
            (node) => node.attributes.node_type === 'input' && (node.attributes as any)?.name === 'csrf_token'
          )?.attributes as any)?.value as string,
        };

    try {
      const response = await kratos.updateRecoveryFlow({
        flow: flow.id,
        updateRecoveryFlowBody: body,
      });

      // Check if there's a continue_with action for settings flow
      if (response.data.continue_with) {
        for (const action of response.data.continue_with) {
          if (action.action === 'show_settings_ui') {
            // Redirect to settings with the flow ID from the continue_with action
            const settingsFlowId = (action as any).flow?.id;
            if (settingsFlowId) {
              navigate(`/settings?flow=${settingsFlowId}`, { replace: true });
              return;
            }
          }
        }
      }

      // If recovery is completed, redirect to settings to complete password reset
      if (response.data.state === 'passed_challenge') {
        navigate('/settings', { replace: true });
      } else {
        // Update flow to show code input and clear the form
        setFlow(response.data);
        setIsLoading(false);
        (e.target as HTMLFormElement).reset();
      }
    } catch (err: any) {
      setIsLoading(false);

      if (err.response?.status === 400) {
        const flowData = err.response.data as RecoveryFlow;
        setFlow(flowData);

        const messages = flowData.ui.messages || [];
        if (messages.length > 0) {
          setError(messages[0].text);
        } else {
          setError('Recovery failed. Please check your input and try again.');
        }
      } else if (err.response?.status === 410) {
        createNewFlow();
      } else {
        setError('An error occurred during recovery. Please try again.');
        console.error('Recovery error:', err);
      }
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

  // Check if we should show code input or email input
  const showCodeInput = flow.ui.nodes.some(
    (node) => node.attributes.node_type === 'input' && (node.attributes as any)?.name === 'code'
  );

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <div className="w-full max-w-md p-8 bg-gradient-to-br from-card to-card/50 rounded-lg border border-border shadow-[0_10px_40px_rgba(0,0,0,0.3)]">
        <h1 className="text-2xl font-bold text-center mb-6 text-foreground" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
          {showCodeInput ? 'Enter Recovery Code' : 'Recover Your Account'}
        </h1>

        {flow.ui.messages?.map((message, idx) => (
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

        {error && !flow.ui.messages?.length && (
          <div className="mb-4 p-3 bg-red-950/20 border border-red-900/50 rounded text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {showCodeInput ? (
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-foreground mb-1">
                Recovery Code
              </label>
              <input
                type="text"
                id="code"
                name="code"
                required
                autoComplete="one-time-code"
                placeholder="Enter the code sent to your email"
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              />
              <p className="mt-2 text-sm text-muted-foreground">
                Check your email for the recovery code. It may take a few minutes to arrive.
              </p>
            </div>
          ) : (
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
                placeholder="Enter your email address"
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              />
              <p className="mt-2 text-sm text-muted-foreground">
                We'll send you a recovery code to reset your password.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {isLoading ? 'Processing...' : showCodeInput ? 'Verify Code' : 'Send Recovery Code'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          Remember your password?{' '}
          <a href="/login" className="text-primary hover:text-primary/80 transition-colors cursor-pointer">
            Sign in
          </a>
        </div>

        {showCodeInput && (
          <div className="mt-2 text-center text-sm text-muted-foreground">
            Didn't receive the code?{' '}
            <button
              type="button"
              onClick={createNewFlow}
              className="text-primary hover:text-primary/80 underline transition-colors cursor-pointer"
            >
              Request a new one
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
