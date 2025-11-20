import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Users } from 'lucide-react';
import { useEntities, useEntity } from '../hooks/useEntities';
import { EntityType, type Entity } from '../types';
import { EntityForm } from './EntityForm';
import { EntityMembersTab } from './EntityMembersTab';

interface EntityPartnersTabProps {
  entityId: string;
}

export function EntityPartnersTab({ entityId }: EntityPartnersTabProps) {
  const { t } = useTranslation('entities');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null);
  const [managingMembersPartnerId, setManagingMembersPartnerId] = useState<string | null>(null);
  const { data, isLoading, error, refetch } = useEntities(EntityType.Partner, entityId);

  const partners = data?.data || [];

  if (isLoading) {
    return <div className="text-center py-8">{t('partners.loading')}</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        {t('partners.errorLoading')}
      </div>
    );
  }

  const handleFormSuccess = () => {
    setShowCreateForm(false);
    setEditingPartnerId(null);
    setManagingMembersPartnerId(null);
    refetch();
  };

  const formatWebsiteUrl = (url: string) => {
    if (!url) return url;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://${url}`;
  };

  return (
    <div>
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl font-semibold">{t('partners.title', 'Partners')}</h2>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            {t('partners.createPartner', 'Create Partner')}
          </button>
        </div>

        {partners.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {t('partners.noPartners', 'No partners yet')}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {partners.map((partner: Entity) => (
              <div
                key={partner.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <h3 className="text-lg font-semibold mb-2 truncate">{partner.name}</h3>

                {partner.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {partner.description}
                  </p>
                )}

                <div className="space-y-2 mb-4 text-sm">
                  <p className="text-gray-700">
                    <span className="font-medium">Email:</span>{' '}
                    <a href={`mailto:${partner.contactEmail}`} className="text-blue-600 hover:underline">
                      {partner.contactEmail}
                    </a>
                  </p>

                  {partner.website && (
                    <p className="text-gray-700">
                      <span className="font-medium">Website:</span>{' '}
                      <a
                        href={formatWebsiteUrl(partner.website)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {partner.website}
                      </a>
                    </p>
                  )}
                </div>

                <div className="flex gap-2 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => setEditingPartnerId(partner.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                    {t('actions.edit', 'Edit')}
                  </button>
                  <button
                    onClick={() => setManagingMembersPartnerId(partner.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded transition-colors"
                  >
                    <Users className="h-4 w-4" />
                    {t('partners.members', 'Members')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">{t('partners.createPartner', 'Create Partner')}</h3>
            <EntityForm
              fixedEntityType={EntityType.Partner}
              onSuccess={handleFormSuccess}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        </div>
      )}

      {editingPartnerId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <EditPartnerModal
            partnerId={editingPartnerId}
            onSuccess={handleFormSuccess}
            onCancel={() => setEditingPartnerId(null)}
          />
        </div>
      )}

      {managingMembersPartnerId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <PartnerMembersModal
            partnerId={managingMembersPartnerId}
            onCancel={() => {
              setManagingMembersPartnerId(null);
              refetch();
            }}
          />
        </div>
      )}
    </div>
  );
}

interface EditPartnerModalProps {
  partnerId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

function EditPartnerModal({ partnerId, onSuccess, onCancel }: EditPartnerModalProps) {
  const { t } = useTranslation('entities');
  const { data: editingPartner, isLoading } = useEntity(partnerId);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="text-center py-8">{t('partners.loading')}</div>
      </div>
    );
  }

  if (!editingPartner) {
    return (
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="text-center py-8 text-red-600">{t('partners.notFound')}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
      <h3 className="text-lg font-semibold mb-4">{t('partners.editPartner', 'Edit Partner')}</h3>
      <EntityForm entity={editingPartner} onSuccess={onSuccess} onCancel={onCancel} />
    </div>
  );
}

interface PartnerMembersModalProps {
  partnerId: string;
  onCancel: () => void;
}

function PartnerMembersModal({ partnerId, onCancel }: PartnerMembersModalProps) {
  const { t } = useTranslation('entities');

  return (
    <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{t('partners.manageMembers', 'Manage Members')}</h3>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
        >
          ×
        </button>
      </div>
      <EntityMembersTab entityId={partnerId} />
    </div>
  );
}
