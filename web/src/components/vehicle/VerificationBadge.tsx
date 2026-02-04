import { useTranslation } from 'react-i18next';
import { ShieldCheck } from 'lucide-react';

interface VerificationBadgeProps {
  isVerified: boolean;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  onClick?: () => void;
}

export function VerificationBadge({ isVerified, size = 'md', showLabel = true, onClick }: VerificationBadgeProps) {
  const { t } = useTranslation('vehicle');

  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  const padding = size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1';

  if (!isVerified) {
    return null;
  }

  const baseClasses = `inline-flex items-center gap-1 rounded-full ${padding} ${textSize} font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400`;
  const interactiveClasses = onClick ? 'cursor-pointer hover:bg-emerald-500/20 transition-colors' : '';

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${baseClasses} ${interactiveClasses}`}
        title={t('verification.badgeTooltip')}
      >
        <ShieldCheck className={iconSize} />
        {showLabel && <span>{t('verification.badge')}</span>}
      </button>
    );
  }

  return (
    <span
      className={baseClasses}
      title={t('verification.badgeTooltip')}
    >
      <ShieldCheck className={iconSize} />
      {showLabel && <span>{t('verification.badge')}</span>}
    </span>
  );
}

interface BlockchainIndicatorProps {
  hasBlockchainProof: boolean;
  size?: 'sm' | 'md';
}

export function BlockchainIndicator({ hasBlockchainProof, size = 'sm' }: BlockchainIndicatorProps) {
  const { t } = useTranslation('vehicle');

  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';

  if (!hasBlockchainProof) {
    return null;
  }

  return (
    <span
      className="inline-flex items-center text-emerald-600 dark:text-emerald-400"
      title={t('verification.anchoredTooltip')}
    >
      <ShieldCheck className={iconSize} />
    </span>
  );
}
