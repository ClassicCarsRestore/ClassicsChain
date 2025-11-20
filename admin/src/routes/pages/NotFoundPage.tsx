import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  const { t } = useTranslation('errors');
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl font-bold text-gray-200 mb-4">404</div>
        <h1 className="text-3xl font-bold mb-2">{t('notFound.title')}</h1>
        <p className="text-muted-foreground mb-8">
          {t('notFound.description')}
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('notFound.goBack')}
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Home className="h-4 w-4 mr-2" />
            {t('notFound.goHome')}
          </button>
        </div>
      </div>
    </div>
  );
}
