import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, AlertCircle } from 'lucide-react';
import type { CreateShareLinkRequest, ShareLinkDuration } from '@/types/shareLink';

interface ShareLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateShareLinkRequest) => Promise<void>;
  isSubmitting: boolean;
}

const DURATIONS: { value: ShareLinkDuration; label: string }[] = [
  { value: '1h', label: '1 hour' },
  { value: '24h', label: '24 hours' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
];

export function ShareLinkModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: ShareLinkModalProps) {
  const { t } = useTranslation('vehicle');
  const [duration, setDuration] = useState<ShareLinkDuration>('7d');
  const [canViewDetails, setCanViewDetails] = useState(true);
  const [canViewPhotos, setCanViewPhotos] = useState(true);
  const [canViewDocuments, setCanViewDocuments] = useState(false);
  const [canViewHistory, setCanViewHistory] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!canViewDetails && !canViewPhotos && !canViewDocuments && !canViewHistory) {
      errors.permissions = t('vehicle:shareLinks.validation.atLeastOnePermission');
    }

    if (recipientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      errors.recipientEmail = t('vehicle:shareLinks.validation.invalidEmail');
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setValidationErrors({});

    if (!validateForm()) {
      return;
    }

    try {
      const data: CreateShareLinkRequest = {
        canViewDetails,
        canViewPhotos,
        canViewDocuments,
        canViewHistory,
        duration,
        recipientEmail: recipientEmail || undefined,
      };

      await onSubmit(data);

      // Reset form
      setDuration('7d');
      setCanViewDetails(true);
      setCanViewPhotos(true);
      setCanViewDocuments(false);
      setCanViewHistory(false);
      setRecipientEmail('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('vehicle:shareLinks.errors.createFailed'));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">{t('vehicle:shareLinks.createModal.title')}</h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1 hover:bg-muted disabled:opacity-50 cursor-pointer"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-500/50 bg-red-500/10 p-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500 mt-0.5" />
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Permissions Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">{t('vehicle:shareLinks.createModal.permissions')}</h3>

            {validationErrors.permissions && (
              <p className="text-sm text-red-500">{validationErrors.permissions}</p>
            )}

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={canViewDetails}
                onChange={(e) => setCanViewDetails(e.target.checked)}
                disabled={isSubmitting}
                className="h-4 w-4 rounded border-input"
              />
              <span className="text-sm text-foreground">{t('vehicle:shareLinks.permissions.details')}</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={canViewPhotos}
                onChange={(e) => setCanViewPhotos(e.target.checked)}
                disabled={isSubmitting}
                className="h-4 w-4 rounded border-input"
              />
              <span className="text-sm text-foreground">{t('vehicle:shareLinks.permissions.photos')}</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={canViewDocuments}
                onChange={(e) => setCanViewDocuments(e.target.checked)}
                disabled={isSubmitting}
                className="h-4 w-4 rounded border-input"
              />
              <span className="text-sm text-foreground">{t('vehicle:shareLinks.permissions.documents')}</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={canViewHistory}
                onChange={(e) => setCanViewHistory(e.target.checked)}
                disabled={isSubmitting}
                className="h-4 w-4 rounded border-input"
              />
              <span className="text-sm text-foreground">{t('vehicle:shareLinks.permissions.history')}</span>
            </label>
          </div>

          {/* Duration Section */}
          <div className="space-y-2">
            <label htmlFor="duration" className="text-sm font-semibold text-foreground">
              {t('vehicle:shareLinks.createModal.duration')}
            </label>
            <select
              id="duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value as ShareLinkDuration)}
              disabled={isSubmitting}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground disabled:opacity-50"
            >
              {DURATIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Email Section */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-semibold text-foreground">
              {t('vehicle:shareLinks.createModal.recipientEmail')}
              <span className="ml-1 text-xs text-muted-foreground">{t('vehicle:shareLinks.createModal.optional')}</span>
            </label>
            <input
              id="email"
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder={t('vehicle:shareLinks.createModal.emailPlaceholder')}
              disabled={isSubmitting}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground disabled:opacity-50"
            />
            {validationErrors.recipientEmail && (
              <p className="text-sm text-red-500">{validationErrors.recipientEmail}</p>
            )}
            <p className="text-xs text-muted-foreground">{t('vehicle:shareLinks.createModal.emailNote')}</p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 transition-colors cursor-pointer"
            >
              {t('vehicle:shareLinks.createModal.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isSubmitting ? t('vehicle:shareLinks.createModal.creating') : t('vehicle:shareLinks.createModal.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
