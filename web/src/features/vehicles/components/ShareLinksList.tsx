import { useState, useCallback } from 'react';
import { Copy, Trash2, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { useVehicleShareLinks, useRevokeShareLink } from '../hooks/useVehicleShareLinks';
import type { ShareLink } from '@/types/shareLink';

interface ShareLinksListProps {
  vehicleId: string;
}

export function ShareLinksList({ vehicleId }: ShareLinksListProps) {
  const { t } = useTranslation('vehicle');
  const { data: response, isLoading } = useVehicleShareLinks(vehicleId);
  const revokeShareLink = useRevokeShareLink(vehicleId);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revokeConfirmation, setRevokeConfirmation] = useState<{ isOpen: boolean; shareLinkId: string | null }>({
    isOpen: false,
    shareLinkId: null,
  });

  const shareLinks = response?.data ?? [];

  const handleCopyUrl = useCallback(
    (shareLink: ShareLink) => {
      const url = `${window.location.origin}/shared/${shareLink.token}`;
      navigator.clipboard.writeText(url);
      setCopiedId(shareLink.id);
      setTimeout(() => setCopiedId(null), 2000);
    },
    []
  );

  const handleRevokeClick = useCallback((shareLinkId: string) => {
    setRevokeConfirmation({ isOpen: true, shareLinkId });
  }, []);

  const handleConfirmRevoke = useCallback(() => {
    if (!revokeConfirmation.shareLinkId) return;
    revokeShareLink.mutate(revokeConfirmation.shareLinkId);
    setRevokeConfirmation({ isOpen: false, shareLinkId: null });
  }, [revokeConfirmation.shareLinkId, revokeShareLink]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">{t('vehicle:loading')}</p>
      </div>
    );
  }

  return (
    <div>

      {shareLinks.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">{t('vehicle:shareLinks.empty')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {shareLinks.map((shareLink) => {
            const expired = isExpired(shareLink.expiresAt);

            return (
              <div
                key={shareLink.id}
                className="flex items-center gap-3 rounded-lg border border-border p-4 bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <p className="text-sm font-medium text-foreground">{t('vehicle:shareLinks.expiresAt')}: {formatDate(shareLink.expiresAt)}</p>
                    {expired && (
                      <span className="ml-auto text-xs bg-red-500/20 text-red-700 px-2 py-1 rounded">{t('vehicle:shareLinks.expired')}</span>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    <p>{t('vehicle:shareLinks.accessedCount', { count: shareLink.accessedCount || 0 })}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {shareLink.permissions.canViewDetails && (
                        <span className="bg-blue-500/20 text-blue-700 text-xs px-2 py-1 rounded">
                          {t('vehicle:shareLinks.permissions.details')}
                        </span>
                      )}
                      {shareLink.permissions.canViewPhotos && (
                        <span className="bg-blue-500/20 text-blue-700 text-xs px-2 py-1 rounded">
                          {t('vehicle:shareLinks.permissions.photos')}
                        </span>
                      )}
                      {shareLink.permissions.canViewDocuments && (
                        <span className="bg-blue-500/20 text-blue-700 text-xs px-2 py-1 rounded">
                          {t('vehicle:shareLinks.permissions.documents')}
                        </span>
                      )}
                      {shareLink.permissions.canViewHistory && (
                        <span className="bg-blue-500/20 text-blue-700 text-xs px-2 py-1 rounded">
                          {t('vehicle:shareLinks.permissions.history')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleCopyUrl(shareLink)}
                    disabled={expired}
                    className="p-2 rounded hover:bg-background transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    title={t('vehicle:shareLinks.copyUrl')}
                  >
                    <Copy className={`h-4 w-4 ${copiedId === shareLink.id ? 'text-green-500' : 'text-muted-foreground'}`} />
                  </button>
                  <button
                    onClick={() => handleRevokeClick(shareLink.id)}
                    disabled={revokeShareLink.isPending}
                    className="p-2 rounded hover:bg-red-500/10 text-red-500 transition-colors disabled:opacity-50 cursor-pointer"
                    title={t('vehicle:shareLinks.revoke')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Revoke Confirmation Modal */}
      <ConfirmationModal
        isOpen={revokeConfirmation.isOpen}
        title={t('vehicle:shareLinks.revokeTitle')}
        message={t('vehicle:shareLinks.revokeMessage')}
        confirmText={t('vehicle:shareLinks.revokeConfirm')}
        cancelText={t('vehicle:shareLinks.revokeCancel')}
        isDangerous
        isLoading={revokeShareLink.isPending}
        onConfirm={handleConfirmRevoke}
        onCancel={() => setRevokeConfirmation({ isOpen: false, shareLinkId: null })}
      />
    </div>
  );
}
