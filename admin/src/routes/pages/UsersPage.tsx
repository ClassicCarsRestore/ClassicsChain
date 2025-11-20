import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UsersList } from '@/features/users/components/UsersList';
import { InviteAdminForm } from '@/features/users/components/InviteAdminForm';

export function UsersPage() {
  const { t } = useTranslation('users');
  const [showInviteModal, setShowInviteModal] = useState(false);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <button
          onClick={() => setShowInviteModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
        >
          {t('inviteAdmin')}
        </button>
      </div>

      <UsersList />

      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">{t('inviteNewAdmin')}</h2>
            <InviteAdminForm
              onSuccess={() => {
                setShowInviteModal(false);
              }}
              onCancel={() => setShowInviteModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
