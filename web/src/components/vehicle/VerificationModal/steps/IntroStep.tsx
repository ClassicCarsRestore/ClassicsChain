import { useTranslation } from 'react-i18next';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface IntroStepProps {
  onNext: () => void;
}

export function IntroStep({ onNext }: IntroStepProps) {
  const { t } = useTranslation('verification');

  const steps = [
    t('intro.steps.1'),
    t('intro.steps.2'),
    t('intro.steps.3'),
    t('intro.steps.4'),
    t('intro.steps.5'),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Shield className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-semibold">{t('intro.title')}</h2>
      </div>

      <p className="text-muted-foreground">
        {t('intro.description')}
      </p>

      <div className="space-y-3">
        <p className="text-sm font-medium">{t('intro.stepsTitle')}</p>
        <ol className="space-y-2">
          {steps.map((step, index) => (
            <li key={index} className="flex items-start gap-3 text-sm text-muted-foreground">
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      <p className="text-sm text-muted-foreground">
        {t('intro.note')}
      </p>

      <div className="flex justify-end pt-4">
        <Button onClick={onNext}>
          {t('intro.startButton')}
        </Button>
      </div>
    </div>
  );
}
