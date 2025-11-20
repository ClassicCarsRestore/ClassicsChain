import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2 } from 'lucide-react';
import { useEntities } from '../hooks/useEntities';
import { EntityType } from '../types';
import { entitiesApi } from '../api/entitiesApi';

export function EntitiesList() {
  const navigate = useNavigate();
  const { t } = useTranslation('entities');
  const [filterType, setFilterType] = useState<EntityType | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { data, isLoading, error, refetch } = useEntities(filterType);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(t('messages.confirmDelete', { name }))) {
      return;
    }

    try {
      setDeletingId(id);
      await entitiesApi.deleteEntity(id);
      refetch();
    } catch (err) {
      console.error('Error deleting entity:', err);
      alert(t('messages.errorDeleting'));
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">{t('messages.loadingEntities')}</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        {t('messages.errorLoading', { error: error.message })}
      </div>
    );
  }

  const entities = data?.data || [];

  return (
    <div>
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 border-b">
        <button
          onClick={() => setFilterType(undefined)}
          className={`px-4 py-2 border-b-2 transition-colors cursor-pointer ${
            filterType === undefined
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          {t('filters.all')}
        </button>
        <button
          onClick={() => setFilterType(EntityType.Certifier)}
          className={`px-4 py-2 border-b-2 transition-colors cursor-pointer ${
            filterType === EntityType.Certifier
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          {t('filters.certifiers')}
        </button>
        <button
          onClick={() => setFilterType(EntityType.Partner)}
          className={`px-4 py-2 border-b-2 transition-colors cursor-pointer ${
            filterType === EntityType.Partner
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          {t('filters.partners')}
        </button>
      </div>

      {/* Entities Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {entities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">{t('messages.noEntities')}</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('fields.name')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('fields.type')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('fields.contactEmail')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('actions.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {entities.map((entity) => (
                <tr key={entity.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{entity.name}</div>
                    {entity.description && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {entity.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        entity.type === EntityType.Certifier
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {t(`types.${entity.type}`)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {entity.contactEmail}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-3">
                    <button
                      onClick={() => navigate(`/entities/${entity.id}`)}
                      className="text-blue-600 hover:text-blue-900 transition-colors cursor-pointer"
                      title={t('actions.edit')}
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(entity.id, entity.name)}
                      disabled={deletingId === entity.id}
                      className="text-red-600 hover:text-red-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      title={t('common.delete') || 'Delete'}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
