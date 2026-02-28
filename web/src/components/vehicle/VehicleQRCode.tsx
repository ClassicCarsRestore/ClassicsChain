import { useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, X } from 'lucide-react';

interface VehicleQRCodeProps {
  vehicleId: string;
  vehicleName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function VehicleQRCode({ vehicleId, vehicleName, isOpen, onClose }: VehicleQRCodeProps) {
  const { t } = useTranslation('vehicle');
  const canvasRef = useRef<HTMLDivElement>(null);

  const verificationUrl = `${window.location.origin}/verify/${vehicleId}`;

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current?.querySelector('canvas');
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${vehicleName.replace(/\s+/g, '-')}-qr.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  }, [vehicleName]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="relative w-full max-w-sm mx-4 rounded-lg border border-border bg-card p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <h3 className="text-lg font-semibold text-foreground mb-1">
          {t('publicVerification.qrCodeTitle')}
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          {t('publicVerification.qrCodeDescription')}
        </p>

        <div ref={canvasRef} className="flex justify-center mb-6">
          <QRCodeCanvas
            value={verificationUrl}
            size={240}
            level="H"
            marginSize={2}
          />
        </div>

        <button
          onClick={handleDownload}
          className="w-full flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 cursor-pointer"
        >
          <Download className="h-4 w-4" />
          {t('publicVerification.downloadQrCode')}
        </button>
      </div>
    </div>
  );
}
