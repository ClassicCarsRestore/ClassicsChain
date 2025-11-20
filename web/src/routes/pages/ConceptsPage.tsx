import { useTranslation } from 'react-i18next';
import { CheckCircle, Link as LinkIcon, Database, Lock, Shield, Zap } from 'lucide-react';
import { SectionDivider } from './HomePage';

export function ConceptsPage() {
  const { t } = useTranslation('concepts');

  const validationSteps = (t('validation.steps', { returnObjects: true }) as any[]) || [];
  const conceptItems = (t('concepts.items', { returnObjects: true }) as any[]) || [];
  const benefits = (t('why.benefits', { returnObjects: true }) as any[]) || [];

  return (
    <div className="mx-auto max-w-4xl">
      {/* Hero Section */}
      <section className="relative py-10 text-center">
        <div className="absolute left-1/2 top-0 h-px w-24 -translate-x-1/2 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>

        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
          {t('hero.title')}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
          {t('hero.subtitle')}
        </p>

        <SectionDivider />
      </section>

      {/* What is Anchoring */}
      <section className="py-10">
        <div className="rounded-lg border border-border bg-card/50 p-8">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {t('whatIs.title')}
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            {t('whatIs.description')}
          </p>
        </div>

        <SectionDivider />
      </section>

      {/* How Validation Works - Steps */}
      <section className="py-10">
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
          {t('validation.title')}
        </h2>

        <div className="mt-16 space-y-8">
          {validationSteps.map((step: any, index: number) => (
            <div key={index} className="relative">
              <div className="flex gap-6">
                {/* Number badge */}
                <div className="flex flex-shrink-0 pt-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-sm font-bold text-primary-foreground shadow-lg">
                    {index + 1}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 rounded-lg border border-border bg-card/30 p-6">
                  <h3 className="text-lg font-semibold tracking-tight text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-2 leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                  {step.details && (
                    <div className="mt-4 space-y-2">
                      {step.details.map((detail: string, idx: number) => (
                        <div key={idx} className="flex gap-2">
                          <CheckCircle className="h-5 w-5 flex-shrink-0 text-primary/70" />
                          <span className="text-sm text-muted-foreground">{detail}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Connector line */}
              {index < validationSteps.length - 1 && (
                <div className="absolute left-5 top-16 h-28 w-px bg-gradient-to-b from-primary/50 to-transparent"></div>
              )}
            </div>
          ))}
        </div>

        <SectionDivider />
      </section>

      {/* Key Concepts */}
      <section className="py-10">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          {t('concepts.title')}
        </h2>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {conceptItems.map((concept: any, index: number) => {
            const icons: { [key: string]: any } = {
              cid: LinkIcon,
              cbor: Database,
              hash: Lock,
              integrity: Shield,
              immutable: Zap,
            };
            const Icon = icons[concept.icon] || LinkIcon;

            return (
              <div key={index} className="rounded-lg border border-border bg-card/50 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold tracking-tight text-foreground">
                      {concept.name}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {concept.explanation}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <SectionDivider />
      </section>

      {/* Technical Example */}
      <section className="py-10">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          {t('example.title')}
        </h2>

        <div className="mt-8 space-y-6">
          <div>
            <h3 className="font-semibold text-foreground">{t('example.step1.title')}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t('example.step1.description')}</p>
            <div className="mt-3 rounded bg-card/80 p-4 font-mono text-xs text-muted-foreground overflow-auto">
              <code>{t('example.step1.code')}</code>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-foreground">{t('example.step2.title')}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t('example.step2.description')}</p>
            <div className="mt-3 rounded bg-card/80 p-4 font-mono text-xs text-muted-foreground overflow-auto">
              <code>{t('example.step2.code')}</code>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-foreground">{t('example.step3.title')}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t('example.step3.description')}</p>
            <div className="mt-3 rounded bg-card/80 p-4 font-mono text-xs text-muted-foreground overflow-auto">
              <code>{t('example.step3.code')}</code>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-foreground">{t('example.step4.title')}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t('example.step4.description')}</p>
            <div className="mt-3 rounded bg-card/80 p-4 font-mono text-xs text-muted-foreground overflow-auto">
              <code>{t('example.step4.code')}</code>
            </div>
          </div>

          <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-6">
            <div className="flex gap-3">
              <CheckCircle className="h-6 w-6 flex-shrink-0 text-primary" />
              <div>
                <h4 className="font-semibold text-foreground">{t('example.result.title')}</h4>
                <p className="mt-1 text-sm text-muted-foreground">{t('example.result.description')}</p>
              </div>
            </div>
          </div>
        </div>

        <SectionDivider />
      </section>

      {/* Why It Matters */}
      <section className="py-10">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          {t('why.title')}
        </h2>

        <div className="mt-8 space-y-4">
          {benefits.map((benefit: any, index: number) => (
            <div key={index} className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{benefit.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
