import { useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useAddEntityMember } from '../hooks/useEntityMembers';

interface AddEntityMemberFormProps {
  entityId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AddEntityMemberForm({ entityId, onSuccess, onCancel }: AddEntityMemberFormProps) {
  const { t } = useTranslation('entities');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const addMember = useAddEntityMember();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      await addMember.mutateAsync({
        entityId,
        data: {
          email,
          name: name.trim() || undefined,
          role
        },
      });
      onSuccess();
    } catch (error) {
      alert(t('members.errorInviting'));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          {t('members.fields.email')} <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          placeholder="user@example.com"
        />
        <p className="mt-1 text-xs text-gray-500">{t('members.emailHelp')}</p>
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          {t('members.fields.name')}
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="John Doe"
        />
      </div>

      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
          {t('members.fields.role')} <span className="text-red-500">*</span>
        </label>
        <select
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value as 'admin' | 'member')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="member">{t('members.roles.member')}</option>
          <option value="admin">{t('members.roles.admin')}</option>
        </select>
      </div>

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={addMember.isPending}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
        >
          {t('actions.cancel')}
        </button>
        <button
          type="submit"
          disabled={addMember.isPending}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
        >
          {addMember.isPending ? t('actions.adding') : t('members.addMember')}
        </button>
      </div>
    </form>
  );
}
