import { useTranslation } from 'react-i18next';
import { Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataDisplay } from '../DataDisplay';
import { ExternalToolLink } from '../ExternalToolLink';
import type { VerificationData } from '../index';

interface BlockchainStepProps {
  data: VerificationData;
  onNext: () => void;
  onBack: () => void;
}

export function BlockchainStep({ data, onNext, onBack }: BlockchainStepProps) {
  const { t } = useTranslation('verification');

  const explorerUrl = `https://lora.algokit.io/${data.network}/transaction/${data.blockchainTxId}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Link2 className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-semibold">{t('blockchain.title')}</h2>
      </div>

      <p className="text-muted-foreground">
        {t('blockchain.description')}
      </p>

      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <p className="text-sm font-medium">{t('blockchain.providesTitle')}</p>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            {t('blockchain.provides.immutability')}
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            {t('blockchain.provides.timestamp')}
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            {t('blockchain.provides.public')}
          </li>
        </ul>
      </div>

      <DataDisplay data={data.blockchainTxId} label={t('blockchain.txLabel')} />

      <ExternalToolLink
        href={explorerUrl}
        label={t('blockchain.verifyLink')}
        description={t('blockchain.verifyDescription')}
      />

      <p className="text-sm text-muted-foreground italic">
        {t('blockchain.note')}
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
