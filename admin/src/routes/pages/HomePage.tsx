import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Building2, ArrowRight } from 'lucide-react';
import { useEntity } from '@/features/entities/hooks/useEntities';
import { EntityDetailsTab } from '@/features/entities/components/EntityDetailsTab';
import { EntityMembersTab } from '@/features/entities/components/EntityMembersTab';
import { EntityPartnersTab } from '@/features/entities/components/EntityPartnersTab';
import { OAuth2ClientsTab } from '@/features/oauth2/components/OAuth2ClientsTab';
import { EntityType } from '@/features/entities/types';
import { TabNavigation } from '@/components/common/TabNavigation';

type Tab = 'details' | 'members' | 'partners' | 'oauth2';

export function HomePage() {
  const { t } = useTranslation('home');
  const { t: tEntities } = useTranslation('entities');
  const navigate = useNavigate();
  const { isGlobalAdmin, getUserEntities, userProfile, getEntityRole } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('details');

  const userEntities = getUserEntities();

  // For single entity users, show entity detail view
  const singleEntityId = !isGlobalAdmin() && userEntities.length === 1 ? userEntities[0].entityId : null;
  const { data: entity, isLoading, error } = useEntity(singleEntityId || '');

  // If showing single entity view
  if (singleEntityId && entity) {
    const userRole = getEntityRole(singleEntityId);
    const isEntityAdmin = userRole === 'admin';
    const canManageEntity = isGlobalAdmin() || isEntityAdmin;
    const isCertifierAdmin = canManageEntity && entity?.type === EntityType.Certifier;

    return (
      <div>
        <h1 className="text-3xl font-bold mb-2">{entity.name}</h1>
        <p className="text-muted-foreground mb-6">
          {tEntities(`types.${entity.type}`)}
        </p>

        <TabNavigation
          tabs={[
            { id: 'details', label: tEntities('tabs.details') },
            { id: 'members', label: tEntities('tabs.members'), visible: canManageEntity },
            { id: 'partners', label: tEntities('tabs.partners', 'Partners'), visible: isCertifierAdmin },
            { id: 'oauth2', label: tEntities('tabs.oauth2', 'API Credentials'), visible: canManageEntity },
          ]}
          activeTab={activeTab}
          onTabChange={(tabId) => setActiveTab(tabId as Tab)}
        />

        {/* Tab Content */}
        {activeTab === 'details' && <EntityDetailsTab entity={entity} canEdit={canManageEntity} />}
        {activeTab === 'members' && canManageEntity && <EntityMembersTab entityId={singleEntityId!} />}
        {activeTab === 'partners' && isCertifierAdmin && <EntityPartnersTab entityId={singleEntityId!} />}
        {activeTab === 'oauth2' && canManageEntity && <OAuth2ClientsTab entityId={singleEntityId!} />}
      </div>
    );
  }

  // If loading single entity
  if (singleEntityId && isLoading) {
    return <div className="text-center py-8">{tEntities('messages.loadingEntity')}</div>;
  }

  // If error loading single entity
  if (singleEntityId && error) {
    return (
      <div className="text-center py-8 text-red-600">
        {tEntities('messages.errorLoadingEntity')}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">
        {userProfile?.name ? t('welcomeWithName', { name: userProfile.name }) : t('welcome')}
      </h1>
      <p className="text-muted-foreground mb-8">
        {isGlobalAdmin() ? t('adminSubtitle') : t('entityUserSubtitle')}
      </p>

      {/* Global Admin Dashboard */}
      {isGlobalAdmin() && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <button
            onClick={() => navigate('/users')}
            className="flex flex-col items-start p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow text-left cursor-pointer"
          >
            <Users className="h-10 w-10 text-blue-600 mb-4" />
            <h2 className="text-xl font-semibold mb-2">{t('adminUsers.title')}</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {t('adminUsers.description')}
            </p>
            <span className="flex items-center text-sm text-blue-600 font-medium">
              {t('adminUsers.goTo')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </span>
          </button>

          <button
            onClick={() => navigate('/entities')}
            className="flex flex-col items-start p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow text-left cursor-pointer"
          >
            <Building2 className="h-10 w-10 text-green-600 mb-4" />
            <h2 className="text-xl font-semibold mb-2">{t('entities.title')}</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {t('entities.description')}
            </p>
            <span className="flex items-center text-sm text-green-600 font-medium">
              {t('entities.goTo')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </span>
          </button>
        </div>
      )}

      {/* Entity User Dashboard */}
      {!isGlobalAdmin() && userEntities.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{t('entities.yourEntities')}</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {userEntities.map((entity) => (
              <button
                key={entity.entityId}
                onClick={() => navigate(`/entities/${entity.entityId}`)}
                className="flex flex-col items-start p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow text-left cursor-pointer"
              >
                <Building2 className="h-8 w-8 text-blue-600 mb-3" />
                <h3 className="text-lg font-semibold mb-1">{entity.entityName}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {t(`types.${entity.entityType}`)} • {t(`roles.${entity.role}`)}
                </p>
                <span className="flex items-center text-sm text-blue-600 font-medium">
                  {t('entities.viewDetails')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No access state */}
      {!isGlobalAdmin() && userEntities.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">{t('noAccess.title')}</h2>
          <p className="text-muted-foreground">
            {t('noAccess.description')}
          </p>
        </div>
      )}
    </div>
  );
}
