import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Upload, Trash2, Loader2 } from 'lucide-react';
import type { Entity } from '../types';
import { EntityForm } from './EntityForm';
import { useUploadEntityLogo, useDeleteEntityLogo } from '../hooks/useEntities';
import { generateStorageUrl } from '@/lib/storage';

interface EntityDetailsTabProps {
  entity: Entity;
  canEdit?: boolean;
}

export function EntityDetailsTab({ entity, canEdit = false }: EntityDetailsTabProps) {
  const { t } = useTranslation('entities');
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadLogo = useUploadEntityLogo();
  const deleteLogo = useDeleteEntityLogo();

  const formatWebsiteUrl = (url: string) => {
    if (!url) return url;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://${url}`;
  };

  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadLogo.mutate({ entityId: entity.id, file });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteLogo = () => {
    deleteLogo.mutate(entity.id);
  };

  const isLogoLoading = uploadLogo.isPending || deleteLogo.isPending;

  return (
    <div>
      {!isEditing ? (
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              {/* Logo */}
              <div className="relative group">
                {entity.logoObjectKey ? (
                  <img
                    src={generateStorageUrl(entity.logoObjectKey)}
                    alt={entity.name}
                    className="h-16 w-16 rounded-lg object-cover border border-gray-200"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xl font-bold border border-gray-200">
                    {entity.name.charAt(0).toUpperCase()}
                  </div>
                )}
                {canEdit && (
                  <div className="absolute inset-0 rounded-lg bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                    {isLogoLoading ? (
                      <Loader2 className="h-4 w-4 text-white animate-spin" />
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="p-1 text-white hover:text-blue-300 cursor-pointer"
                          title={entity.logoObjectKey ? 'Replace logo' : 'Upload logo'}
                        >
                          <Upload className="h-4 w-4" />
                        </button>
                        {entity.logoObjectKey && (
                          <button
                            type="button"
                            onClick={handleDeleteLogo}
                            className="p-1 text-white hover:text-red-300 cursor-pointer"
                            title="Remove logo"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleLogoSelect}
                  className="hidden"
                />
              </div>
              <h2 className="text-xl font-semibold">{t('details.title')}</h2>
            </div>
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
