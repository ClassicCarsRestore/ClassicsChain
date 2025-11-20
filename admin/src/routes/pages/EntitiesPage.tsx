import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EntitiesList } from '@/features/entities/components/EntitiesList';
import { EntityForm } from '@/features/entities/components/EntityForm';

export function EntitiesPage() {
  const { t } = useTranslation('entities');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCloseModal = () => {
    setShowCreateModal(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
        >
          {t('addEntity')}
        </button>
      </div>

      <EntitiesList />

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{t('addEntity')}</h2>
            <EntityForm onSuccess={handleCloseModal} onCancel={handleCloseModal} />
          </div>
        </div>
      )}
    </div>
  );
}
