import { useTranslation } from 'react-i18next';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataDisplay } from '../DataDisplay';
import type { VerificationData } from '../index';

interface EventDataStepProps {
  data: VerificationData;
  onNext: () => void;
  onBack: () => void;
}

export function EventDataStep({ data, onNext, onBack }: EventDataStepProps) {
  const { t } = useTranslation('verification');

  const formattedJSON = (() => {
    try {
      return JSON.stringify(JSON.parse(data.cidSourceJSON), null, 2);
    } catch {
      return data.cidSourceJSON;
    }
  })();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <FileText className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-semibold">{t('eventData.title')}</h2>
      </div>

      <p className="text-muted-foreground">
        {t('eventData.description')}
      </p>

      <DataDisplay data={formattedJSON} />

      <p className="text-sm text-muted-foreground">
        {t('eventData.note')}
      </p>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          {t('common.back')}
        </Button>
        <Button onClick={onNext}>
          {t('common.next')}
        </Button>
      </div>
    </div>
  );
}
