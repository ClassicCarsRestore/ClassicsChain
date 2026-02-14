import { useTranslation } from 'react-i18next';
import { Package, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataDisplay } from '../DataDisplay';
import { ExternalToolLink } from '../ExternalToolLink';
import type { VerificationData } from '../index';

interface CBORStepProps {
  data: VerificationData;
  onNext: () => void;
  onBack: () => void;
}

export function CBORStep({ data, onNext, onBack }: CBORStepProps) {
  const { t } = useTranslation('verification');

  const cborToolUrl = 'https://cbor.williamchong.cloud/';

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
          <Package className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-semibold">{t('cbor.title')}</h2>
      </div>

      <p className="text-muted-foreground">
        {t('cbor.description')}
      </p>

      <div className="space-y-3">
        <DataDisplay data={formattedJSON} label={t('cbor.jsonLabel')} maxHeight="8rem" />

        <div className="flex justify-center">
          <ArrowRight className="h-5 w-5 text-muted-foreground rotate-90" />
        </div>

        <DataDisplay data={data.cidSourceCBOR} label={t('cbor.cborLabel')} maxHeight="6rem" />
      </div>

      <ExternalToolLink
        href={cborToolUrl}
        label={t('cbor.verifyLink')}
        description={t('cbor.verifyDescription')}
      />

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
