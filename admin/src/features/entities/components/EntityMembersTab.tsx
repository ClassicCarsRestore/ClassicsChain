import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UserPlus, Trash2 } from 'lucide-react';
import { useEntityMembers, useRemoveEntityMember, useUpdateEntityMemberRole } from '../hooks/useEntityMembers';
import { AddEntityMemberForm } from './AddEntityMemberForm';
import type { EntityMember } from '../types/member';

interface EntityMembersTabProps {
  entityId: string;
}

export function EntityMembersTab({ entityId }: EntityMembersTabProps) {
  const { t } = useTranslation('entities');
  const [showAddForm, setShowAddForm] = useState(false);
  const { data: members, isLoading, error } = useEntityMembers(entityId);
  const removeMember = useRemoveEntityMember();
  const updateRole = useUpdateEntityMemberRole();

  const handleRemove = async (userId: string) => {
    if (!confirm(t('members.confirmRemove'))) return;

    try {
      await removeMember.mutateAsync({ entityId, userId });
    } catch (error) {
      alert(t('members.errorRemoving'));
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'member') => {
    try {
      await updateRole.mutateAsync({ entityId, userId, data: { role: newRole } });
    } catch (error) {
      alert(t('members.errorUpdatingRole'));
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">{t('members.loading')}</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        {t('members.errorLoading')}
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl font-semibold">{t('members.title')}</h2>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            {t('members.addMember')}
          </button>
        </div>

        {!members || members.length === 0 ? (
          <div className="text-center py-8 text-gray-500">{t('members.noMembers')}</div>
        ) : (
          <div className="overflow-hidden border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('members.fields.name')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('members.fields.email')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('members.fields.role')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('members.fields.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {members.map((member: EntityMember) => (
                  <tr key={member.userId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.userName || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.userEmail || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.userId, e.target.value as 'admin' | 'member')}
                        className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        disabled={updateRole.isPending}
                      >
                        <option value="member">{t('members.roles.member')}</option>
                        <option value="admin">{t('members.roles.admin')}</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => handleRemove(member.userId)}
                        disabled={removeMember.isPending}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">{t('members.addMember')}</h3>
            <AddEntityMemberForm
              entityId={entityId}
              onSuccess={() => setShowAddForm(false)}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
