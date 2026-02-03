import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface DataDisplayProps {
  data: string;
  label?: string;
  maxHeight?: string;
}

export function DataDisplay({ data, label, maxHeight = '12rem' }: DataDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(data);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      {label && (
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
      )}
      <div
        className="relative rounded-lg border border-border bg-muted/50 p-4 pr-12 font-mono text-xs overflow-auto"
        style={{ maxHeight }}
      >
        <pre className="whitespace-pre-wrap break-all">{data}</pre>
        <button
          type="button"
          onClick={handleCopy}
          className="absolute right-2 top-2 cursor-pointer p-1.5 rounded-md bg-muted/80 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          title="Copy to clipboard"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
