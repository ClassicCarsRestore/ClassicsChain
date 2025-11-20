import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { useEntity } from '@/features/entities/hooks/useEntities';
import { EntityDetailsTab } from '@/features/entities/components/EntityDetailsTab';
import { EntityMembersTab } from '@/features/entities/components/EntityMembersTab';
import { EntityPartnersTab } from '@/features/entities/components/EntityPartnersTab';
import { OAuth2ClientsTab } from '@/features/oauth2/components/OAuth2ClientsTab';
import { EntityType } from '@/features/entities/types';
import { useAuth } from '@/contexts/AuthContext';
import { TabNavigation } from '@/components/common/TabNavigation';

type Tab = 'details' | 'members' | 'partners' | 'oauth2';

export function EntityDetailPage() {
  const { entityId } = useParams<{ entityId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('entities');
  const [activeTab, setActiveTab] = useState<Tab>('details');
  const { isGlobalAdmin, getEntityRole } = useAuth();

  const { data: entity, isLoading, error } = useEntity(entityId || '');

  // Determine user permissions for this entity
  const userRole = entityId ? getEntityRole(entityId) : null;
  const isEntityAdmin = userRole === 'admin';
  const canManageEntity = isGlobalAdmin() || isEntityAdmin;
  const isCertifierAdmin = canManageEntity && entity?.type === EntityType.Certifier;

  if (!entityId) {
    return (
      <div className="text-center py-8 text-red-600">
        {t('messages.errorLoadingEntity')}
      </div>
    );
  }

  if (isLoading) {
    return <div className="text-center py-8">{t('messages.loadingEntity')}</div>;
  }

  if (error || !entity) {
    return (
      <div className="text-center py-8 text-red-600">
        {t('messages.errorLoadingEntity')}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        {/* Only show back button for global admins (they came from entities list) */}
        {isGlobalAdmin() && (
          <button
            onClick={() => navigate('/entities')}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('actions.backToList')}
          </button>
        )}
      </div>

      <h1 className="text-3xl font-bold mb-2">{entity.name}</h1>
      <p className="text-muted-foreground mb-6">
        {t(`types.${entity.type}`)}
      </p>

      <TabNavigation
        tabs={[
          { id: 'details', label: t('tabs.details') },
          { id: 'members', label: t('tabs.members'), visible: canManageEntity },
          { id: 'partners', label: t('tabs.partners', 'Partners'), visible: isCertifierAdmin },
          { id: 'oauth2', label: t('tabs.oauth2', 'API Credentials'), visible: canManageEntity },
        ]}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as Tab)}
      />

      {/* Tab Content */}
      {activeTab === 'details' && <EntityDetailsTab entity={entity} canEdit={canManageEntity} />}
      {activeTab === 'members' && canManageEntity && <EntityMembersTab entityId={entityId!} />}
      {activeTab === 'partners' && isCertifierAdmin && <EntityPartnersTab entityId={entityId!} />}
      {activeTab === 'oauth2' && canManageEntity && <OAuth2ClientsTab entityId={entityId!} />}
    </div>
  );
}
