import { useState } from 'react';
import type { LoginFlow, UpdateLoginFlowBody } from '@ory/client';
import { kratos } from '@/lib/kratos';

interface TotpChallengeProps {
  flow: LoginFlow;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  onBackupCodesClick?: () => void;
}

export function TotpChallenge({
  flow,
  onSuccess,
  onError,
  onBackupCodesClick
}: TotpChallengeProps) {
  const [totpCode, setTotpCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpCode.trim() || totpCode.length !== 6) return;

    setIsSubmitting(true);
    setError('');

    try {
      const csrfNode = flow.ui.nodes.find(
        node => (node.attributes as any)?.name === 'csrf_token'
      );

      const body: UpdateLoginFlowBody = {
        method: 'totp',
        totp_code: totpCode,
        csrf_token: (csrfNode?.attributes as any)?.value as string,
      };

      await kratos.updateLoginFlow({
        flow: flow.id,
        updateLoginFlowBody: body,
      });

      onSuccess?.();
    } catch (err: any) {
      const errorMsg = err.response?.data?.ui?.messages?.[0]?.text ||
                      'Invalid TOTP code. Please try again.';
      setError(errorMsg);
      onError?.(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Enter Verification Code</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Enter the 6-digit code from your authenticator app
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-950/20 border border-red-900/50 rounded text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={totpCode}
          onChange={e => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          maxLength={6}
          className="w-full px-3 py-3 border border-border rounded text-center text-2xl tracking-widest font-mono"
          autoFocus
          disabled={isSubmitting}
        />

        <button
          type="submit"
          disabled={isSubmitting || totpCode.length !== 6}
          className="w-full py-2 px-4 bg-primary text-primary-foreground rounded font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Verifying...' : 'Verify'}
        </button>

        <button
          type="button"
          onClick={onBackupCodesClick}
          className="w-full py-2 px-4 border border-border rounded font-medium text-sm hover:bg-muted"
        >
          Use Backup Code Instead
        </button>
      </form>
    </div>
  );
}
