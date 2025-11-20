import { useNavigate, useRouteError } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, AlertCircle } from 'lucide-react';

export function ErrorPage() {
  const { t } = useTranslation('errors');
  const navigate = useNavigate();
  const error = useRouteError();

  const errorMessage = error instanceof Error ? error.message : t('error.unknownError');

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2">{t('error.title')}</h1>
        <p className="text-muted-foreground mb-4">
          {t('error.description')}
        </p>
        <p className="text-sm text-gray-500 mb-8 bg-gray-100 p-3 rounded">
          {errorMessage}
        </p>

        <button
          onClick={() => navigate('/')}
          className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full"
        >
          <Home className="h-4 w-4 mr-2" />
          {t('error.goHome')}
        </button>
      </div>
    </div>
  );
}
