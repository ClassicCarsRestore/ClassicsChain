import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  const { t } = useTranslation('errors');

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="mx-auto max-w-2xl text-center">
        {/* Decorative top accent */}
        <div className="absolute left-1/2 top-10 h-px w-24 -translate-x-1/2 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>

        {/* Large 404 number */}
        <div className="mb-8 text-9xl font-bold text-primary/20" style={{ textShadow: '0 4px 20px rgba(255,199,95,0.2)' }}>
          404
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
          {t('notFound.title')}
        </h1>
        <p className="mx-auto mt-6 max-w-lg text-lg leading-8 text-muted-foreground">
          {t('notFound.description')}
        </p>

        {/* Decorative divider */}
        <div className="mx-auto mt-12 flex w-full max-w-md items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border"></div>
          <div className="flex gap-1">
            <div className="h-1.5 w-1.5 rotate-45 bg-primary/30"></div>
            <div className="h-1.5 w-1.5 rotate-45 bg-primary/60"></div>
            <div className="h-1.5 w-1.5 rotate-45 bg-primary"></div>
            <div className="h-1.5 w-1.5 rotate-45 bg-primary/60"></div>
            <div className="h-1.5 w-1.5 rotate-45 bg-primary/30"></div>
          </div>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border"></div>
        </div>

        {/* CTA Buttons */}
        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button
            onClick={() => window.history.back()}
            className="group relative overflow-hidden rounded-md border border-border bg-card px-8 py-3.5 text-sm font-semibold text-foreground transition-all duration-300 hover:border-primary/50 hover:bg-card/80 hover:shadow-[0_0_20px_rgba(255,199,95,0.2)]"
          >
            <span className="relative z-10 flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t('notFound.goBack')}
            </span>
          </button>
          <Link
            to="/"
            className="group relative overflow-hidden rounded-md bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(255,199,95,0.4)]"
          >
            <span className="relative z-10 flex items-center gap-2">
              <Home className="h-4 w-4" />
              {t('notFound.goHome')}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary opacity-0 transition-opacity duration-300 group-hover:opacity-20"></div>
          </Link>
        </div>
      </div>
    </div>
  );
}
