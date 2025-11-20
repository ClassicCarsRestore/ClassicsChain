import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shield, History, Network } from 'lucide-react';

export function HomePage() {
  const { t } = useTranslation('landing');

  return (
    <div className="mx-auto max-w-7xl">
      {/* Hero Section */}
      <section className="relative py-20 text-center">
        {/* Decorative top accent */}
        <div className="absolute left-1/2 top-0 h-px w-24 -translate-x-1/2 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>

        <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
          {t('hero.title')}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
          {t('hero.subheading')}
        </p>
          <div className="mt-16 flex flex-col items-center justify-center gap-4">
              <button
                  onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                  className="group text-sm font-semibold leading-6 text-foreground transition-all duration-200 hover:text-primary cursor-pointer"
              >
                  {t('hero.cta.secondary')} <span aria-hidden="true" className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
              </button>
              <Link
                  to="/registration"
                  className="group relative overflow-hidden rounded-md bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(255,199,95,0.4)]"
              >
                  <span className="relative z-10">{t('hero.cta.primary')}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary opacity-0 transition-opacity duration-300 group-hover:opacity-20"></div>
              </Link>
          </div>

          <SectionDivider />
      </section>

      {/* Features Section */}
      <section>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
            {t('features.title')}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t('features.subtitle')}
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Authentic by Design */}
          <div className="group relative overflow-hidden rounded-lg border border-border bg-gradient-to-br from-card to-card/50 p-8 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_10px_40px_rgba(0,0,0,0.3)]">
            {/* Corner accent */}
            <div className="absolute right-0 top-0 h-px w-16 bg-gradient-to-l from-primary/50 to-transparent"></div>
            <div className="absolute right-0 top-0 h-16 w-px bg-gradient-to-b from-primary/50 to-transparent"></div>

            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
              <Shield className="h-7 w-7 text-primary transition-transform duration-300 group-hover:scale-110" />
            </div>
            <h3 className="mt-6 text-lg font-semibold tracking-tight text-foreground">
              {t('features.authentic.title')}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t('features.authentic.description')}
            </p>
          </div>

          {/* Complete Vehicle History */}
          <div className="group relative overflow-hidden rounded-lg border border-border bg-gradient-to-br from-card to-card/50 p-8 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-[0_10px_40px_rgba(0,0,0,0.3)]">
            {/* Corner accent */}
            <div className="absolute right-0 top-0 h-px w-16 bg-gradient-to-l from-accent/50 to-transparent"></div>
            <div className="absolute right-0 top-0 h-16 w-px bg-gradient-to-b from-accent/50 to-transparent"></div>

            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-accent/20 to-accent/5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
              <History className="h-7 w-7 text-accent transition-transform duration-300 group-hover:scale-110" />
            </div>
            <h3 className="mt-6 text-lg font-semibold tracking-tight text-foreground">
              {t('features.history.title')}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t('features.history.description')}
            </p>
          </div>

          {/* Global Trust Network */}
          <div className="group relative overflow-hidden rounded-lg border border-border bg-gradient-to-br from-card to-card/50 p-8 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_10px_40px_rgba(0,0,0,0.3)]">
            {/* Corner accent */}
            <div className="absolute right-0 top-0 h-px w-16 bg-gradient-to-l from-primary/50 to-transparent"></div>
            <div className="absolute right-0 top-0 h-16 w-px bg-gradient-to-b from-primary/50 to-transparent"></div>

            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
              <Network className="h-7 w-7 text-primary transition-transform duration-300 group-hover:scale-110" />
            </div>
            <h3 className="mt-6 text-lg font-semibold tracking-tight text-foreground">
              {t('features.network.title')}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t('features.network.description')}
            </p>
          </div>
        </div>

        <SectionDivider />
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
            {t('howItWorks.title')}
          </h2>
        </div>
        <div className="mx-auto mt-16 grid max-w-5xl gap-8 md:grid-cols-3">
          {(t('howItWorks.steps', { returnObjects: true }) as Array<{ title: string; description: string }>).map((step, index) => (
            <div key={index} className="relative">
              {/* Connecting line (hidden on last item) */}
              {index < 2 && (
                <div className="absolute left-[calc(50%+40px)] top-12 hidden h-px w-[calc(100%-80px)] bg-gradient-to-r from-primary/30 to-primary/30 md:block"></div>
              )}

              <div className="flex flex-col items-center">
                {/* Numbered badge */}
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-lg font-bold text-primary-foreground shadow-lg">
                  {index + 1}
                </div>

                {/* Content */}
                <div className="mt-6 text-center">
                  <h3 className="text-lg font-semibold tracking-tight text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Link
            to="/concepts"
            className="group relative overflow-hidden rounded-md bg-secondary px-8 py-3 text-sm font-semibold text-secondary-foreground shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,0,0,0.2)]"
          >
            <span className="relative z-10">{t('howItWorks.learnMore')}</span>
            <div className="absolute inset-0 bg-gradient-to-r from-secondary via-primary/20 to-secondary opacity-0 transition-opacity duration-300 group-hover:opacity-30"></div>
          </Link>
        </div>

        <SectionDivider />
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="relative overflow-hidden rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-card via-card to-card/80 px-6 py-16 text-center shadow-[0_20px_70px_rgba(0,0,0,0.4)] sm:px-16">
          {/* Decorative corner accents */}
          <div className="absolute left-0 top-0 h-20 w-20 border-l-2 border-t-2 border-primary/50"></div>
          <div className="absolute bottom-0 right-0 h-20 w-20 border-b-2 border-r-2 border-primary/50"></div>

          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            color: 'var(--primary)'
          }}></div>

          <div className="relative z-10">
            <h2 className="text-3xl font-bold tracking-tight text-foreground" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
              {t('cta.title')}
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-muted-foreground">
              {t('cta.subtitle')}
            </p>
            <div className="mt-10 flex items-center justify-center gap-6">
              <Link
                to="/registration"
                className="group relative overflow-hidden rounded-md bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-[0_8px_30px_rgba(0,0,0,0.4)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(255,199,95,0.5)]"
              >
                <span className="relative z-10">{t('cta.button')}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-accent via-primary to-accent opacity-0 transition-opacity duration-500 group-hover:opacity-30"></div>
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"></div>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export function SectionDivider() {
    return (
        <div className="mx-auto mt-20 flex w-full max-w-md items-center gap-4">
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
    );
}
