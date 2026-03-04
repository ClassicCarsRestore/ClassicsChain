import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, UserCheck, Clock, AlertCircle, Send } from 'lucide-react';
import { useVehicleInvitation, useSendVehicleInvitation, useVehicleDetail } from '../hooks/useVehicles';
import { toast } from 'sonner';

interface OwnerManagementSectionProps {
  vehicleId: string;
}

export function OwnerManagementSection({ vehicleId }: OwnerManagementSectionProps) {
  const { t } = useTranslation('vehicles');
  const [email, setEmail] = useState('');

  const { data: vehicle, isLoading: isLoadingVehicle } = useVehicleDetail(vehicleId);
  const ownerId = vehicle?.ownerId;

  const { data: invitation, isLoading: isLoadingInvitation } = useVehicleInvitation(
    !ownerId ? vehicleId : undefined
  );
  const sendInvitation = useSendVehicleInvitation();

  const isLoading = isLoadingVehicle || (!ownerId && isLoadingInvitation);

  const handleSendInvitation = async () => {
    if (!email.trim()) return;

    try {
      await sendInvitation.mutateAsync({ vehicleId, email: email.trim() });
      toast.success(t('ownerManagement.invitationSent'));
      setEmail('');
    } catch {
      toast.error(t('toast.vehicleError'));
    }
  };

  if (ownerId) {
    return (
      <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
        <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
          <UserCheck className="h-5 w-5" />
          <span className="font-medium">{t('browse.status.owned')}</span>
        </div>
        <p className="text-sm text-green-600 dark:text-green-500 mt-1">
          {t('ownerManagement.ownedDescription')}
        </p>
        <code className="text-xs text-green-700 dark:text-green-400 mt-2 block break-all">
          {ownerId}
        </code>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 bg-muted rounded-lg animate-pulse">
        <div className="h-4 bg-muted-foreground/20 rounded w-1/3" />
      </div>
    );
  }

  if (invitation?.hasPendingInvitation) {
    const isExpired = invitation.expiresAt && new Date(invitation.expiresAt) < new Date();

    return (
      <div className={`p-4 rounded-lg border ${
        isExpired
          ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
          : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
      }`}>
        <div className={`flex items-center gap-2 ${
          isExpired
            ? 'text-red-700 dark:text-red-400'
            : 'text-amber-700 dark:text-amber-400'
        }`}>
          {isExpired ? (
            <AlertCircle className="h-5 w-5" />
          ) : (
            <Clock className="h-5 w-5" />
          )}
          <span className="font-medium">
            {isExpired ? t('ownerManagement.expired') : t('ownerManagement.pendingInvite')}
          </span>
        </div>
        <div className={`text-sm mt-2 ${
          isExpired
            ? 'text-red-600 dark:text-red-500'
            : 'text-amber-600 dark:text-amber-500'
        }`}>
          <p>{t('ownerManagement.inviteSentTo')}:</p>
          <code className="text-xs font-mono block mt-1">{invitation.email}</code>
          {invitation.expiresAt && (
            <p className="text-xs mt-2">
              {t('ownerManagement.expiresAt')}: {new Date(invitation.expiresAt).toLocaleString()}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg space-y-3">
      <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
        <Mail className="h-5 w-5" />
        <span className="font-medium">{t('ownerManagement.unclaimedNoInvite')}</span>
      </div>
      <p className="text-sm text-yellow-600 dark:text-yellow-500">
        {t('ownerManagement.unclaimedDescription')}
      </p>

      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('ownerManagement.enterEmail')}
          className="flex-1 px-3 py-2 text-sm border border-yellow-300 dark:border-yellow-700 rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && email.trim()) {
              handleSendInvitation();
            }
          }}
        />
        <button
          onClick={handleSendInvitation}
          disabled={!email.trim() || sendInvitation.isPending}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 disabled:cursor-not-allowed rounded-md transition-colors cursor-pointer"
        >
          <Send className="h-4 w-4" />
          {sendInvitation.isPending
            ? t('ownerManagement.sending')
            : t('ownerManagement.sendInvitation')
          }
        </button>
      </div>
    </div>
  );
}
