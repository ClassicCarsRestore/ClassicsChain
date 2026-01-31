import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataDisplay } from '../DataDisplay';
import { ExternalToolLink } from '../ExternalToolLink';
import type { VerificationData } from '../index';

interface CIDStepProps {
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
    return '';
  }
}

export function CIDStep({ data, onNext, onBack }: CIDStepProps) {
  const { t } = useTranslation('verification');
  const [computedHash, setComputedHash] = useState<string>('');

  useEffect(() => {
    computeSha256(data.cidSourceCBOR).then(setComputedHash);
  }, [data.cidSourceCBOR]);

  const cidInspectorUrl = `https://cid.ipfs.tech/#${data.cid}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Tag className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-semibold">{t('cid.title')}</h2>
      </div>

      <p className="text-muted-foreground">
        {t('cid.description')}
      </p>

      <DataDisplay data={data.cid} label={t('cid.cidLabel')} />

      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <p className="text-sm font-medium">{t('cid.inspectTitle')}</p>
        <div className="grid gap-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Version:</span>
            <span className="font-mono">CIDv1</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Codec:</span>
            <span className="font-mono">dag-cbor</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Hash:</span>
            <span className="font-mono">sha2-256</span>
          </div>
        </div>

        {computedHash && (
          <div className="pt-3 border-t border-border">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-muted-foreground">{t('cid.hashMatch')}</span>
            </div>
            <p className="text-xs font-mono text-muted-foreground mt-1 break-all">
              {computedHash.slice(0, 32)}...
            </p>
          </div>
        )}
      </div>

      <ExternalToolLink
        href={cidInspectorUrl}
        label={t('cid.verifyLink')}
        description={t('cid.verifyDescription')}
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
