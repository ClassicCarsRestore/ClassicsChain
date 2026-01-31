import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Hash, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataDisplay } from '../DataDisplay';
import { ExternalToolLink } from '../ExternalToolLink';
import type { VerificationData } from '../index';

interface HashingStepProps {
  data: VerificationData;
  onNext: () => void;
  onBack: () => void;
}

async function computeSha256(base64Data: string): Promise<string> {
  try {
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return 'Error computing hash';
  }
}

export function HashingStep({ data, onNext, onBack }: HashingStepProps) {
  const { t } = useTranslation('verification');
  const [computedHash, setComputedHash] = useState<string>('');

  useEffect(() => {
    computeSha256(data.cidSourceCBOR).then(setComputedHash);
  }, [data.cidSourceCBOR]);

  const sha256ToolUrl = `https://emn178.github.io/online-tools/sha256.html`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Hash className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-semibold">{t('hashing.title')}</h2>
      </div>

      <p className="text-muted-foreground">
        {t('hashing.description')}
      </p>

      <div className="space-y-3">
        <DataDisplay data={data.cidSourceCBOR} label={t('hashing.cborLabel')} maxHeight="6rem" />

        <div className="flex justify-center">
          <ArrowRight className="h-5 w-5 text-muted-foreground rotate-90" />
        </div>

        <DataDisplay data={computedHash} label={t('hashing.hashLabel')} maxHeight="4rem" />
      </div>

      <ExternalToolLink
        href={sha256ToolUrl}
        label={t('hashing.verifyLink')}
        description={t('hashing.verifyDescription')}
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
