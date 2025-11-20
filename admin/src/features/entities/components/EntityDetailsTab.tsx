import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil } from 'lucide-react';
import type { Entity } from '../types';
import { EntityForm } from './EntityForm';

interface EntityDetailsTabProps {
  entity: Entity;
  canEdit?: boolean;
}

export function EntityDetailsTab({ entity, canEdit = false }: EntityDetailsTabProps) {
  const { t } = useTranslation('entities');
  const [isEditing, setIsEditing] = useState(false);

  const formatWebsiteUrl = (url: string) => {
    if (!url) return url;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://${url}`;
  };

  return (
    <div>
      {!isEditing ? (
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-xl font-semibold">{t('details.title')}</h2>
            {canEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
              >
                <Pencil className="h-4 w-4" />
                {t('actions.edit')}
              </button>
            )}
          </div>

          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('fields.name')}</dt>
              <dd className="mt-1 text-sm text-gray-900">{entity.name}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">{t('fields.type')}</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    entity.type === 'certifier'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {t(`types.${entity.type}`)}
                </span>
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">{t('fields.contactEmail')}</dt>
              <dd className="mt-1 text-sm text-gray-900">{entity.contactEmail}</dd>
            </div>

            {entity.website && (
              <div>
                <dt className="text-sm font-medium text-gray-500">{t('fields.website')}</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <a
                    href={formatWebsiteUrl(entity.website)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {entity.website}
                  </a>
                </dd>
              </div>
            )}

            {entity.description && (
              <div className="col-span-2">
                <dt className="text-sm font-medium text-gray-500">{t('fields.description')}</dt>
                <dd className="mt-1 text-sm text-gray-900">{entity.description}</dd>
              </div>
            )}

            {entity.address && (
              <div className="col-span-2">
                <dt className="text-sm font-medium text-gray-500">{t('fields.address')}</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {entity.address.street && <div>{entity.address.street}</div>}
                  <div>
                    {entity.address.city}
                    {entity.address.state && `, ${entity.address.state}`}
                    {entity.address.postalCode && ` ${entity.address.postalCode}`}
                  </div>
                  <div>{entity.address.country}</div>
                </dd>
              </div>
            )}
          </dl>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-6">{t('editEntity')}</h2>
          <EntityForm
            entity={entity}
            onSuccess={() => setIsEditing(false)}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      )}
    </div>
  );
}
