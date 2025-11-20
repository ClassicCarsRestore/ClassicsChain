import { useState } from 'react';
import { useCreateUser } from '../hooks/useUsers';

interface InviteAdminFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function InviteAdminForm({ onSuccess, onCancel }: InviteAdminFormProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const createUser = useCreateUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createUser.mutateAsync({
        email,
        name: name || undefined,
      });

      onSuccess?.();
    } catch (error) {
      console.error('Failed to invite admin:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email *
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="admin@example.com"
        />
        <p className="mt-1 text-xs text-gray-500">
          A recovery link will be sent to this email address
        </p>
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Name (optional)
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

      {createUser.isError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {createUser.error instanceof Error ? createUser.error.message : 'Failed to invite admin'}
        </div>
      )}

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={createUser.isPending}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {createUser.isPending ? 'Inviting...' : 'Invite Admin'}
        </button>
      </div>
    </form>
  );
}
