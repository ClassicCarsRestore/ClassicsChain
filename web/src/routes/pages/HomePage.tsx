import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  History,
  Award,
  Wrench,
  Calendar,
  Landmark,
  FileCheck,
  Link as LinkIcon,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

function ClassicCarSilhouette() {
  return (
    <svg
      viewBox="0 0 800 300"
      className="w-full max-w-4xl mx-auto opacity-[0.07]"
      fill="currentColor"
    >
      {/* Porsche 911 inspired silhouette */}
      <path
        d="M120 220
           C120 220 130 180 160 165
           C190 150 220 145 260 145
           L300 145
           C320 145 340 120 380 100
           C420 80 480 70 540 70
           C600 70 660 85 700 110
           C740 135 760 160 770 180
           C780 200 780 220 780 220
           L120 220 Z"
        className="text-primary"
      />
      {/* Front wheel */}
      <circle cx="200" cy="220" r="45" className="text-background" />
      <circle cx="200" cy="220" r="35" className="text-primary" />
      <circle cx="200" cy="220" r="15" className="text-background" />
      {/* Rear wheel */}
      <circle cx="620" cy="220" r="45" className="text-background" />
      <circle cx="620" cy="220" r="35" className="text-primary" />
      <circle cx="620" cy="220" r="15" className="text-background" />
      {/* Window line */}
      <path
        d="M340 140
           C360 115 400 95 460 85
           C520 75 580 80 620 95
           C640 102 655 112 665 125
           L340 140 Z"
        className="text-background"
        opacity="0.5"
      />
    </svg>
  );
}

function PassportPreview() {
  const { t } = useTranslation('landing');

  return (
    <div className="relative">
      {/* Glow effect */}
      <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-accent/10 to-primary/20 blur-2xl opacity-50" />

      {/* Card */}
      <div className="relative rounded-2xl border border-primary/30 bg-gradient-to-br from-card via-card to-card/80 p-6 shadow-2xl backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{t('preview.label')}</p>
            <h3 className="text-xl font-bold text-foreground mt-1">1973 Porsche 911 Carrera RS</h3>
            <p className="text-sm text-muted-foreground font-mono mt-1">VIN: 9113600XXX</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-medium text-emerald-500">{t('preview.verified')}</span>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{t('preview.timeline')}</p>
          <div className="flex items-center gap-3">
            {/* Event 1 */}
            <div className="flex-1 rounded-lg bg-muted/50 p-3 border border-border">
              <div className="flex items-center gap-2 mb-1">
                <Wrench className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-medium text-foreground">{t('preview.events.restoration')}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">2024</p>
            </div>

            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />

            {/* Event 2 */}
            <div className="flex-1 rounded-lg bg-muted/50 p-3 border border-border">
              <div className="flex items-center gap-2 mb-1">
                <Award className="w-3.5 h-3.5 text-accent" />
                <span className="text-xs font-medium text-foreground">{t('preview.events.concours')}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">2024</p>
            </div>

            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />

            {/* Event 3 */}
            <div className="flex-1 rounded-lg bg-muted/50 p-3 border border-border">
              <div className="flex items-center gap-2 mb-1">
                <FileCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xs font-medium text-foreground">{t('preview.events.certified')}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">2025</p>
            </div>
          </div>
        </div>

        {/* Blockchain badge */}
        <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">{t('preview.anchored')}</span>
          </div>
          <code className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
            bafkrei...x7q4
          </code>
        </div>
      </div>
    </div>
  );
}

const audienceCards = [
  {
    key: 'collectors',
    icon: History,
    color: 'primary',
  },
  {
    key: 'workshops',
    icon: Wrench,
    color: 'accent',
  },
  {
    key: 'events',
    icon: Calendar,
    color: 'primary',
  },
  {
    key: 'heritage',
    icon: Landmark,
    color: 'accent',
  },
] as const;

function AudienceSection() {
  const { t } = useTranslation('landing');

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {audienceCards.map(({ key, icon: Icon, color }) => (
        <div
          key={key}
          className={`group relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-card to-card/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
            color === 'primary' ? 'hover:border-primary/50' : 'hover:border-accent/50'
          }`}
        >
          {/* Corner accent */}
          <div className={`absolute right-0 top-0 h-px w-20 bg-gradient-to-l ${
            color === 'primary' ? 'from-primary/50' : 'from-accent/50'
          } to-transparent`} />
          <div className={`absolute right-0 top-0 h-20 w-px bg-gradient-to-b ${
            color === 'primary' ? 'from-primary/50' : 'from-accent/50'
          } to-transparent`} />

          <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${
            color === 'primary' ? 'from-primary/20 to-primary/5' : 'from-accent/20 to-accent/5'
          } transition-transform duration-300 group-hover:scale-110`}>
            <Icon className={`h-6 w-6 ${color === 'primary' ? 'text-primary' : 'text-accent'}`} />
          </div>

          <h3 className="mt-4 text-lg font-semibold text-foreground">
            {t(`audience.${key}.title`)}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {t(`audience.${key}.description`)}
          </p>
        </div>
      ))}
    </div>
  );
}

function HowItWorksFlow() {
  const { t } = useTranslation('landing');

  const steps = [
    { icon: FileCheck, label: t('flow.document') },
    { icon: LinkIcon, label: t('flow.anchor') },
    { icon: ShieldCheck, label: t('flow.verified') },
  ];

  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg">
              <step.icon className="h-7 w-7" />
            </div>
            <span className="mt-3 text-sm font-medium text-foreground text-center max-w-[120px]">
              {step.label}
            </span>
          </div>

          {index < steps.length - 1 && (
            <div className="hidden md:block w-24 h-px bg-gradient-to-r from-primary/50 to-primary/50 mx-4" />
          )}
          {index < steps.length - 1 && (
            <div className="md:hidden h-8 w-px bg-gradient-to-b from-primary/50 to-primary/50 my-2" />
          )}
        </div>
      ))}
    </div>
  );
}

export function HomePage() {
  const { t } = useTranslation('landing');

  return (
    <div className="mx-auto max-w-7xl">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24">
        {/* Background silhouette */}
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
          <ClassicCarSilhouette />
        </div>

        {/* Content */}
        <div className="relative text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-tight">
            {t('hero.title')}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg md:text-xl text-muted-foreground leading-relaxed">
            {t('hero.subtitle')}
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/registration"
              className="group relative overflow-hidden rounded-lg bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(var(--primary),0.4)]"
            >
              <span className="relative z-10">{t('hero.cta.primary')}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary opacity-0 transition-opacity duration-300 group-hover:opacity-20" />
            </Link>

            <button
              onClick={() => document.getElementById('preview')?.scrollIntoView({ behavior: 'smooth' })}
              className="group text-base font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t('hero.cta.secondary')}
              <span className="inline-block ml-1 transition-transform group-hover:translate-x-1">→</span>
            </button>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* Product Preview */}
      <section id="preview" className="py-16 md:py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            {t('preview.title')}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('preview.subtitle')}
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <PassportPreview />
        </div>
      </section>

      <SectionDivider />

      {/* Audience Section */}
      <section className="py-16 md:py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            {t('audience.title')}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('audience.subtitle')}
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <AudienceSection />
        </div>
      </section>

      <SectionDivider />

      {/* How It Works */}
      <section className="py-16 md:py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            {t('flow.title')}
          </h2>
        </div>

        <HowItWorksFlow />

        <div className="mt-12 text-center">
          <Link
            to="/concepts"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            {t('flow.learnMore')}
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <SectionDivider />

      {/* Final CTA */}
      <section className="py-16 md:py-20">
        <div className="relative overflow-hidden rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-card via-card to-card/80 px-6 py-16 text-center shadow-2xl sm:px-16">
          {/* Corner accents */}
          <div className="absolute left-0 top-0 h-24 w-24 border-l-2 border-t-2 border-primary/50 rounded-tl-2xl" />
          <div className="absolute bottom-0 right-0 h-24 w-24 border-b-2 border-r-2 border-primary/50 rounded-br-2xl" />

          {/* Background pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              color: 'var(--primary)'
            }}
          />

          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              {t('cta.title')}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              {t('cta.subtitle')}
            </p>
            <div className="mt-8">
              <Link
                to="/registration"
                className="group relative inline-flex overflow-hidden rounded-lg bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(var(--primary),0.5)]"
              >
                <span className="relative z-10">{t('cta.button')}</span>
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
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
    <div className="mx-auto flex w-full max-w-md items-center gap-4 py-4">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
      <div className="flex gap-1">
        <div className="h-1.5 w-1.5 rotate-45 bg-primary/30" />
        <div className="h-1.5 w-1.5 rotate-45 bg-primary/60" />
        <div className="h-1.5 w-1.5 rotate-45 bg-primary" />
        <div className="h-1.5 w-1.5 rotate-45 bg-primary/60" />
        <div className="h-1.5 w-1.5 rotate-45 bg-primary/30" />
      </div>
      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
    </div>
  );
}
