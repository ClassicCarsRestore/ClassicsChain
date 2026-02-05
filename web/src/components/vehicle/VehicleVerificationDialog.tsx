import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Check, ExternalLink, ShieldCheck, Database, Fingerprint, Code } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

function SourceDataSection({
  cidSourceJson,
  cidSourceCbor,
  copiedField,
  onCopy,
  t,
}: {
  cidSourceJson?: string;
  cidSourceCbor?: string;
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
  t: ReturnType<typeof useTranslation>['t'];
}) {
  const [showCbor, setShowCbor] = useState(false);

  const formatJson = (json: string) => {
    try {
      return JSON.stringify(JSON.parse(json), null, 2);
    } catch {
      return json;
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Code className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{t('verification.sourceDataLabel')}</span>
      </div>
      <p className="text-xs text-muted-foreground">
        {t('verification.sourceDataDescription')}
      </p>

      {cidSourceJson && cidSourceCbor && (
        <>
          <div className="flex rounded-md border border-border bg-muted/30 p-0.5">
            <button
              type="button"
              onClick={() => setShowCbor(false)}
              className={`flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                !showCbor
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('verification.jsonLabel')}
            </button>
            <button
              type="button"
              onClick={() => setShowCbor(true)}
              className={`flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                showCbor
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('verification.cborLabel')}
            </button>
          </div>

          {!showCbor && (
            <div className="relative rounded-md border border-border bg-muted/50 p-3">
              <pre className="text-xs font-mono overflow-x-auto max-h-40 whitespace-pre-wrap break-all">
                {formatJson(cidSourceJson)}
              </pre>
              <button
                type="button"
                onClick={() => onCopy(cidSourceJson, 'json')}
                className="absolute top-2 right-2 p-1.5 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-foreground"
              >
                {copiedField === 'json' ? (
                  <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          )}

          {showCbor && (
            <div className="relative rounded-md border border-border bg-muted/50 p-3">
              <pre className="text-xs font-mono overflow-x-auto max-h-40 whitespace-pre-wrap break-all">
                {cidSourceCbor}
              </pre>
              <button
                type="button"
                onClick={() => onCopy(cidSourceCbor, 'cbor')}
                className="absolute top-2 right-2 p-1.5 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-foreground"
              >
                {copiedField === 'cbor' ? (
                  <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          )}
        </>
      )}

      {cidSourceJson && !cidSourceCbor && (
        <div className="relative rounded-md border border-border bg-muted/50 p-3">
          <pre className="text-xs font-mono overflow-x-auto max-h-40 whitespace-pre-wrap break-all">
            {formatJson(cidSourceJson)}
          </pre>
          <button
            type="button"
            onClick={() => onCopy(cidSourceJson, 'json')}
            className="absolute top-2 right-2 p-1.5 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-foreground"
          >
            {copiedField === 'json' ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}

interface VehicleVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: {
    vehicleName: string;
    blockchainAssetId: string;
    cid?: string;
    cidSourceJson?: string;
    cidSourceCbor?: string;
    network: string;
  };
}

export function VehicleVerificationDialog({
  open,
  onOpenChange,
  data,
}: VehicleVerificationDialogProps) {
  const { t } = useTranslation('vehicle');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const explorerUrl = `https://lora.algokit.io/${data.network}/asset/${data.blockchainAssetId}`;
  const cidInspectorUrl = data.cid ? `https://cid.ipfs.tech/#${data.cid}` : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogTitle className="flex items-center gap-3 text-lg font-semibold">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="h-4 w-4" />
          </div>
          {t('verification.dialogTitle')}
        </DialogTitle>

        <p className="text-sm text-muted-foreground mt-2">
          {t('verification.dialogDescription')}
        </p>

        <div className="mt-6 space-y-6">
          {/* Blockchain Asset ID */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t('verification.assetIdLabel')}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('verification.assetIdDescription')}
            </p>
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 p-3">
              <code className="flex-1 break-all font-mono text-sm">{data.blockchainAssetId}</code>
              <div className="flex gap-1">
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-emerald-500"
                  title={t('verification.viewOnExplorer')}
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button
                  type="button"
                  onClick={() => copyToClipboard(data.blockchainAssetId, 'asset-id')}
                  className="p-1.5 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-foreground"
                >
                  {copiedField === 'asset-id' ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* CID */}
          {data.cid && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Fingerprint className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{t('verification.cidLabel')}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('verification.cidDescription')}
              </p>
              <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 p-3">
                <code className="flex-1 break-all font-mono text-sm">{data.cid}</code>
                <div className="flex gap-1">
                  {cidInspectorUrl && (
                    <a
                      href={cidInspectorUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-primary"
                      title={t('verification.verifyCid')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => copyToClipboard(data.cid!, 'cid')}
                    className="p-1.5 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-foreground"
                  >
                    {copiedField === 'cid' ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground font-mono">
                {t('verification.cidComponents')}
              </p>
            </div>
          )}

          {/* Source Data */}
          {(data.cidSourceJson || data.cidSourceCbor) && (
            <SourceDataSection
              cidSourceJson={data.cidSourceJson}
              cidSourceCbor={data.cidSourceCbor}
              copiedField={copiedField}
              onCopy={copyToClipboard}
              t={t}
            />
          )}
        </div>

        <div className="flex justify-end pt-4 mt-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('verification.close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
