import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy } from 'lucide-react';
import {
  useOAuth2Clients,
  useDeleteOAuth2Client,
  useCreateOAuth2Client,
} from '../hooks/useOAuth2Clients';
import type { OAuth2Client } from '../types';
import { SCOPE_I18N_KEYS, AVAILABLE_SCOPES } from '../types';

interface OAuth2ClientsListProps {
  entityId: string;
}

interface CopyBoxProps {
  value: string;
  bgColor?: string;
  borderColor?: string;
}

function CopyableCode({ value, bgColor = 'bg-gray-100', borderColor = 'border-gray-200' }: CopyBoxProps) {
  const { t } = useTranslation('oauth2');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getHoverColor = () => {
    if (bgColor.includes('yellow')) return 'hover:bg-yellow-200';
    return 'hover:bg-gray-200';
  };

  return (
    <div className={`flex items-center gap-2 p-2 ${bgColor} rounded border ${borderColor} cursor-pointer`}>
      <code className="flex-1 font-mono text-sm break-all">{value}</code>
      <button
        onClick={handleCopy}
        className={`flex-shrink-0 p-1 ${getHoverColor()} rounded transition-colors`}
        title={copied ? t('copied') : t('copy')}
      >
        <Copy className={`h-4 w-4 ${copied ? 'text-green-600' : ''}`} />
      </button>
    </div>
  );
}

export function OAuth2ClientsList({ entityId }: OAuth2ClientsListProps) {
  const { t } = useTranslation('oauth2');
  const [isCreating, setIsCreating] = useState(false);
  const { data: response, isLoading, error } = useOAuth2Clients(entityId);
  const { mutate: deleteClient, isPending: isDeleting } =
    useDeleteOAuth2Client();
  const { isPending: isCreatingClient } =
    useCreateOAuth2Client();
  const [clientSecretMap, setClientSecretMap] = useState<Record<string, string>>({});

  const handleDelete = (clientId: string) => {
    if (confirm(t('confirmDelete'))) {
      deleteClient({ entityId, clientId });
    }
  };

  const getScopeDescription = (scope: string): string => {
    const i18nKey = SCOPE_I18N_KEYS[scope];
    return i18nKey ? t(i18nKey) : scope;
  };

  if (isLoading) {
    return <div className="text-gray-500">{t('title')}...</div>;
  }

  if (error) {
    return (
      <div className="text-red-600">
        {t('errors.loading')}: {(error as Error).message}
      </div>
    );
  }

  let clients: OAuth2Client[] = [];
  if (response && typeof response === 'object') {
    if ('data' in response && Array.isArray((response as any).data)) {
      clients = (response as any).data;
    } else if (Array.isArray(response)) {
      clients = response as OAuth2Client[];
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsCreating(true)}
          disabled={isCreating}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {t('createNew')}
        </button>
      </div>

      {isCreating && (
        <CreateOAuth2ClientForm
          entityId={entityId}
          onSuccess={(clientId, secret) => {
            setClientSecretMap(prev => ({ ...prev, [clientId]: secret }));
            setIsCreating(false);
          }}
          onCancel={() => setIsCreating(false)}
          isLoading={isCreatingClient}
        />
      )}

      {clients.length === 0 ? (
        <p className="text-gray-600">{t('noClients')}</p>
      ) : (
        <div className="space-y-4">
          {[...clients].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((client: OAuth2Client) => {
            const hasSecret = clientSecretMap[client.clientId];
            return (
              <div
                key={client.clientId}
                className="p-4 border border-gray-200 rounded"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold">{client.description}</p>
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 mb-1">{t('fields.clientId')}:</p>
                      <CopyableCode value={client.clientId} />
                    </div>
                    {hasSecret && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-600 mb-1">{t('fields.clientSecret')}:</p>
                        <CopyableCode value={clientSecretMap[client.clientId]} bgColor="bg-yellow-100" borderColor="border-yellow-300" />
                        <p className="text-sm text-yellow-800 mt-2 flex items-center gap-1">
                          <span>⚠️</span>
                          {t('save')}
                        </p>
                      </div>
                    )}
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 mb-1">{t('fields.scopes')}:</p>
                      <div className="flex flex-wrap gap-2">
                        {client.scopes.map((scope: string) => (
                          <span
                            key={scope}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                            title={getScopeDescription(scope)}
                          >
                            {scope}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {t('fields.createdAt')}: {new Date(client.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(client.clientId)}
                    disabled={isDeleting}
                    className="px-3 py-1 text-red-600 border border-red-600 rounded hover:bg-red-50 disabled:opacity-50"
                  >
                    {t('delete')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface CreateOAuth2ClientFormProps {
  entityId: string;
  onSuccess: (clientId: string, clientSecret: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function CreateOAuth2ClientForm({
  entityId,
  onSuccess,
  onCancel,
  isLoading,
}: CreateOAuth2ClientFormProps) {
  const { t } = useTranslation('oauth2');
  const [description, setDescription] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const { mutate: createClient } = useCreateOAuth2Client();

  const getScopeDescription = (scope: string): string => {
    const i18nKey = SCOPE_I18N_KEYS[scope];
    return i18nKey ? t(i18nKey) : scope;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedScopes.length === 0) {
      alert(t('form.scopesRequired'));
      return;
    }

    createClient(
      {
        entityId,
        data: {
          description,
          scopes: selectedScopes,
        },
      },
      {
        onSuccess: (response) => {
          const clientId = (response as any).clientId || '';
          const clientSecret = (response as any).clientSecret || '';
          onSuccess(clientId, clientSecret);
          setDescription('');
          setSelectedScopes([]);
        },
        onError: (error) => {
          console.error('Failed to create client:', error);
          alert(t('errors.creating'));
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border border-gray-200 rounded">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t('form.description')}</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('form.descriptionPlaceholder')}
            className="w-full px-3 py-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">{t('form.scopes')}</label>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {AVAILABLE_SCOPES.map((scope: string) => (
              <label key={scope} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedScopes.includes(scope)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedScopes([...selectedScopes, scope]);
                    } else {
                      setSelectedScopes(
                        selectedScopes.filter((s) => s !== scope)
                      );
                    }
                  }}
                  className="mr-2"
                />
                <span className="text-sm">
                  {scope} - {getScopeDescription(scope)}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {t('form.create')}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            {t('form.cancel')}
          </button>
        </div>
      </div>
    </form>
  );
}
