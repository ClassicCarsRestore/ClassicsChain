import { useTranslation } from 'react-i18next';
import { Calendar, Camera, FileText, History, ShieldCheck } from 'lucide-react';

interface VehicleStatsProps {
  totalEvents: number;
  anchoredEvents: number;
  photosCount: number;
  documentsCount: number;
  earliestEventDate?: string;
}

export function VehicleStats({
  totalEvents,
  anchoredEvents,
  photosCount,
  documentsCount,
  earliestEventDate,
}: VehicleStatsProps) {
  const { t } = useTranslation('vehicle');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
    });
  };

  const stats = [
    {
      icon: History,
      value: totalEvents,
      label: t('stats.events'),
    },
    {
      icon: ShieldCheck,
      value: anchoredEvents,
      label: t('stats.verified'),
      highlight: anchoredEvents > 0,
    },
    {
      icon: Camera,
      value: photosCount,
      label: t('stats.photos'),
    },
    {
      icon: FileText,
      value: documentsCount,
      label: t('stats.documents'),
    },
  ];

  return (
    <div className="rounded-lg border border-border bg-card p-4 mb-8">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
        {stats.map((stat, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              stat.highlight ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground'
            }`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className={`text-xl font-bold ${stat.highlight ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}

        {earliestEventDate && (
          <div className="flex items-center gap-3 col-span-2 sm:col-span-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {formatDate(earliestEventDate)}
              </p>
              <p className="text-xs text-muted-foreground">{t('stats.historySince')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
