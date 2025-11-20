import { useState } from 'react';
import type { LoginFlow, UpdateLoginFlowBody } from '@ory/client';
import { kratos } from '@/lib/kratos';

interface BackupCodeChallengeProps {
  flow: LoginFlow;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  onBackClick?: () => void;
}

export function BackupCodeChallenge({
  flow,
  onSuccess,
  onError,
  onBackClick
}: BackupCodeChallengeProps) {
  const [backupCode, setBackupCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!backupCode.trim()) return;

    setIsSubmitting(true);
    setError('');

    try {
      const csrfNode = flow.ui.nodes.find(
        node => (node.attributes as any)?.name === 'csrf_token'
      );

      const body: UpdateLoginFlowBody = {
        method: 'lookup_secret',
        lookup_secret: backupCode,
        csrf_token: (csrfNode?.attributes as any)?.value as string,
      };

      await kratos.updateLoginFlow({
        flow: flow.id,
        updateLoginFlowBody: body,
      });

      onSuccess?.();
    } catch (err: any) {
      const errorMsg = err.response?.data?.ui?.messages?.[0]?.text ||
                      'Invalid backup code. Please try again.';
      setError(errorMsg);
      onError?.(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBackClick}
          className="text-sm text-primary hover:text-primary/80"
        >
          Back
        </button>
        <h2 className="text-lg font-semibold">Use Backup Code</h2>
      </div>

      <p className="text-sm text-muted-foreground">
        Enter one of your backup codes to sign in
      </p>

      {error && (
        <div className="p-3 bg-red-950/20 border border-red-900/50 rounded text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={backupCode}
          onChange={e => setBackupCode(e.target.value.toUpperCase())}
          placeholder="XXXX-XXXX-XXXX"
          className="w-full px-3 py-3 border border-border rounded font-mono text-sm"
          autoFocus
          disabled={isSubmitting}
        />

        <button
          type="submit"
          disabled={isSubmitting || !backupCode.trim()}
          className="w-full py-2 px-4 bg-primary text-primary-foreground rounded font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Verifying...' : 'Verify'}
        </button>
      </form>
    </div>
  );
}
