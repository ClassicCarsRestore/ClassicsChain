import { useEffect, useState } from 'react';
import type { SettingsFlow, UpdateSettingsFlowBody } from '@ory/client';
import { kratos } from '@/lib/kratos';

interface TotpSetupProps {
  flowId: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function TotpSetup({ flowId, onSuccess, onError }: TotpSetupProps) {
  const [flow, setFlow] = useState<SettingsFlow | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [setupStep, setSetupStep] = useState<'scan' | 'verify' | 'complete'>('scan');

  useEffect(() => {
    const fetchFlow = async () => {
      try {
        const { data } = await kratos.getSettingsFlow({ id: flowId });
        setFlow(data);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to fetch flow');
        onError?.(error);
        setError(error.message);
      }
    };

    fetchFlow();
  }, [flowId, onError]);

  const handleTotpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flow || !totpCode.trim()) return;

    setIsSubmitting(true);
    setError('');

    try {
      const csrfToken = (flow.ui.nodes.find(
        node => (node.attributes as any)?.name === 'csrf_token'
      )?.attributes as any)?.value as string;

      const body: UpdateSettingsFlowBody = {
        method: 'totp',
        csrf_token: csrfToken,
        totp_code: totpCode,
      };

      const { data: completedFlow } = await kratos.updateSettingsFlow({
        flow: flowId,
        updateSettingsFlowBody: body,
      });

      setFlow(completedFlow);

      // Extract backup codes from lookup_secret nodes
      const backupCodeNode = completedFlow.ui.nodes.find(
        node => node.group === 'lookup_secret' &&
                (node.attributes as any)?.name === 'lookup_secret_codes'
      );

      if ((backupCodeNode?.attributes as any)?.value) {
        const codes = Array.isArray((backupCodeNode?.attributes as any)?.value)
          ? (backupCodeNode?.attributes as any)?.value
          : [(backupCodeNode?.attributes as any)?.value];
        setBackupCodes(codes as string[]);
        setSetupStep('complete');
      } else {
        onSuccess?.();
        setSetupStep('verify');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.ui?.messages?.[0]?.text ||
                      err.message ||
                      'Failed to verify TOTP code';
      setError(errorMsg);

      // Update flow with error state
      if (err.response?.data) {
        setFlow(err.response.data);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!flow) {
    return <div className="text-center">Loading...</div>;
  }

  const qrNode = flow.ui.nodes.find(
    node => node.group === 'totp' && node.type === 'img'
  );

  const secretNode = flow.ui.nodes.find(
    node => node.group === 'totp' && node.type === 'text'
  );

  return (
    <div className="space-y-6">
      {setupStep === 'scan' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Set Up Two-Factor Authentication</h2>
          <p className="text-sm text-muted-foreground">
            Scan the QR code with an authenticator app like Google Authenticator or Authy.
          </p>

          {(qrNode?.attributes as any)?.src && (
            <div className="flex justify-center">
              <img
                src={(qrNode?.attributes as any)?.src}
                alt="TOTP QR Code"
                className="w-48 h-48 border-2 border-border rounded"
              />
            </div>
          )}

          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-2">Can't scan the QR code?</p>
            <p className="text-xs text-muted-foreground mb-2">
              Enter this secret key manually:
            </p>
            {(secretNode?.attributes as any)?.value && (
              <code className="block p-3 bg-muted rounded text-sm font-mono break-all">
                {(secretNode?.attributes as any)?.value}
              </code>
            )}
          </div>

          <button
            onClick={() => setSetupStep('verify')}
            className="w-full py-2 px-4 bg-primary text-primary-foreground rounded font-medium hover:bg-primary/90"
          >
            Next: Verify Code
          </button>
        </div>
      )}

      {setupStep === 'verify' && (
        <form onSubmit={handleTotpSubmit} className="space-y-4">
          <h2 className="text-xl font-semibold">Verify Your Code</h2>
          <p className="text-sm text-muted-foreground">
            Enter the 6-digit code from your authenticator app:
          </p>

          {error && (
            <div className="p-3 bg-red-950/20 border border-red-900/50 rounded text-red-400 text-sm">
              {error}
            </div>
          )}

          <input
            type="text"
            value={totpCode}
            onChange={e => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            className="w-full px-3 py-2 border border-border rounded text-center text-2xl tracking-widest font-mono"
            autoFocus
          />

          <button
            type="submit"
            disabled={isSubmitting || totpCode.length !== 6}
            className="w-full py-2 px-4 bg-primary text-primary-foreground rounded font-medium disabled:opacity-50 hover:bg-primary/90"
          >
            {isSubmitting ? 'Verifying...' : 'Verify & Complete Setup'}
          </button>
        </form>
      )}

      {setupStep === 'complete' && backupCodes.length > 0 && (
        <div className="space-y-4 border-2 border-green-900/30 bg-green-950/10 rounded p-4">
          <h2 className="text-xl font-semibold text-green-400">Setup Complete!</h2>

          <div className="space-y-2">
            <h3 className="font-medium">Save Your Backup Codes</h3>
            <p className="text-sm text-muted-foreground">
              If you lose access to your authenticator app, you can use these backup codes to sign in.
              Keep them in a safe place.
            </p>

            <div className="bg-background p-3 rounded space-y-1 font-mono text-sm">
              {backupCodes.map((code, idx) => (
                <div key={idx}>{code}</div>
              ))}
            </div>

            <button
              onClick={() => {
                const text = backupCodes.join('\n');
                navigator.clipboard.writeText(text);
              }}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              Copy all codes
            </button>
          </div>

          <button
            onClick={onSuccess}
            className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded font-medium"
          >
            I've Saved My Codes
          </button>
        </div>
      )}
    </div>
  );
}
