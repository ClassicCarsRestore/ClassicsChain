import { useTranslation } from 'react-i18next';
import { useUsers } from '../hooks/useUsers';

export function UsersList() {
  const { t } = useTranslation('users');
  const { data: users, isLoading, error } = useUsers();

  if (isLoading) {
    return <div className="text-muted-foreground">{t('messages.loadingUsers')}</div>;
  }

  if (error) {
    return (
      <div className="text-destructive">
        {t('messages.errorLoading', { error: error.message })}
      </div>
    );
  }

  if (!users || users.length === 0) {
    return <div className="text-muted-foreground">{t('messages.noUsers')}</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">{t('usersList')}</h2>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('fields.name')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('fields.email')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
