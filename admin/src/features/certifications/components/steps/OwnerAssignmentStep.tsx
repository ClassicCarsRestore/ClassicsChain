import { useTranslation } from 'react-i18next';
import { Mail, Info, UserCheck } from 'lucide-react';

interface OwnerAssignmentStepProps {
  ownerEmail: string;
  onChange: (email: string) => void;
  hasExistingOwner?: boolean;
  existingOwnerId?: string | null;
}

export function OwnerAssignmentStep({
  ownerEmail,
  onChange,
  hasExistingOwner = false,
  existingOwnerId,
}: OwnerAssignmentStepProps) {
  const { t } = useTranslation('vehicles');

  if (hasExistingOwner && existingOwnerId) {
    return (
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-muted-foreground">
          {t('ownerAssignment.title', 'Owner Assignment')}
        </h4>
        <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <UserCheck className="h-5 w-5" />
            <span className="font-medium">{t('ownerAssignment.owned', 'Vehicle has an owner')}</span>
          </div>
          <p className="text-sm text-green-600 dark:text-green-500 mt-1">
            {t('ownerAssignment.ownedDescription', 'This vehicle is already assigned to a user and cannot be reassigned through this form.')}
          </p>
          <code className="text-xs text-green-700 dark:text-green-400 mt-2 block">
            {existingOwnerId}
          </code>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-muted-foreground">
        {t('ownerAssignment.title', 'Owner Assignment')}
      </h4>

      <div>
        <label className="block text-sm font-medium mb-2">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            {t('ownerAssignment.emailLabel', 'Owner Email (Optional)')}
          </div>
        </label>
        <input
          type="email"
          value={ownerEmail}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t('ownerAssignment.emailPlaceholder', 'Enter owner email address')}
          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start gap-2 text-blue-700 dark:text-blue-400">
          <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium mb-1">
              {t('ownerAssignment.infoTitle', 'How owner assignment works:')}
            </p>
            <ul className="list-disc list-inside space-y-1 text-blue-600 dark:text-blue-500">
              <li>{t('ownerAssignment.infoExisting', 'If the email matches an existing user, ownership is assigned immediately')}</li>
              <li>{t('ownerAssignment.infoNew', 'If the email is new, an invitation will be sent to claim the vehicle')}</li>
              <li>{t('ownerAssignment.infoEmpty', 'Leave empty to create an unclaimed vehicle that anyone can claim')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
