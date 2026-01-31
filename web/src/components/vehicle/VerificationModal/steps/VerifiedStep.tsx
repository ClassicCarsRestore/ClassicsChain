import { useTranslation } from 'react-i18next';
import { CheckCircle, ArrowRight, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import type { VerificationData } from '../index';

interface VerifiedStepProps {
  data: VerificationData;
  onDone: () => void;
}

export function VerifiedStep({ data, onDone }: VerifiedStepProps) {
  const { t } = useTranslation('verification');

  const eventDate = new Date(data.eventDate).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const steps = [
    { label: t('verified.chain.eventData'), verified: true },
    { label: t('verified.chain.cbor'), verified: true },
    { label: t('verified.chain.hash'), verified: true },
    { label: t('verified.chain.cid'), verified: true },
    { label: t('verified.chain.blockchain'), verified: true },
  ];

  return (
    <div className="space-y-6 py-4">
      <div className="text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 text-green-500 mb-4">
          <CheckCircle className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-semibold">{t('verified.title')}</h2>
      </div>

      <div className="flex items-center justify-center gap-1 py-4 overflow-x-auto">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/10 text-green-500">
                <CheckCircle className="h-3.5 w-3.5" />
              </div>
              <span className="text-[10px] text-muted-foreground mt-1 whitespace-nowrap">
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <ArrowRight className="h-3 w-3 text-green-500 mx-1" />
            )}
          </div>
        ))}
      </div>

      <p className="text-center text-muted-foreground">
        {t('verified.description', { date: eventDate })}
      </p>

      <Link
        to="/concepts"
        onClick={onDone}
        className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors group"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
          <BookOpen className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium group-hover:text-primary transition-colors">
            {t('verified.learnMoreLink')}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('verified.learnMoreDescription')}
          </p>
        </div>
      </Link>

      <div className="flex justify-center pt-4">
        <Button onClick={onDone}>
          {t('verified.doneButton')}
        </Button>
      </div>
    </div>
  );
}
