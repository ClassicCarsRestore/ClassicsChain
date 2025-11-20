import { useTranslation } from 'react-i18next';
import { OAuth2ClientsList } from './OAuth2ClientsList';

interface OAuth2ClientsTabProps {
  entityId: string;
}

export function OAuth2ClientsTab({ entityId }: OAuth2ClientsTabProps) {
  const { t } = useTranslation('oauth2');

  return (
    <div className="space-y-4">
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">{t('title')}</h2>
        <p className="text-sm text-gray-600 mb-4">{t('description')}</p>
        <OAuth2ClientsList entityId={entityId} />
      </div>
    </div>
  );
}
