import { Link, useRouteError } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, AlertCircle } from 'lucide-react';

export function ErrorPage() {
  const { t } = useTranslation('errors');
  const error = useRouteError();

  const errorMessage = error instanceof Error ? error.message : t('error.unknownError');

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="mx-auto max-w-2xl text-center">
        {/* Decorative top accent */}
        <div className="absolute left-1/2 top-10 h-px w-24 -translate-x-1/2 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>

        {/* Icon */}
        <div className="mb-8 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 shadow-lg">
            <AlertCircle className="h-10 w-10 text-primary" />
          </div>
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
          {t('error.title')}
        </h1>
        <p className="mx-auto mt-6 max-w-lg text-lg leading-8 text-muted-foreground">
          {t('error.description')}
        </p>

        {/* Error details */}
        <div className="mx-auto mt-8 max-w-lg rounded-lg border border-border/50 bg-card/50 p-4 backdrop-blur-sm">
          <p className="text-xs font-mono text-muted-foreground line-clamp-3">
            {errorMessage}
          </p>
        </div>

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

        {/* CTA Button */}
        <div className="mt-12 flex justify-center">
          <Link
            to="/"
            className="group relative overflow-hidden rounded-md bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(255,199,95,0.4)]"
          >
            <span className="relative z-10 flex items-center gap-2">
              <Home className="h-4 w-4" />
              {t('error.goHome')}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary opacity-0 transition-opacity duration-300 group-hover:opacity-20"></div>
          </Link>
        </div>
      </div>
    </div>
  );
}
