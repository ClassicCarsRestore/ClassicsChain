import { useTranslation } from 'react-i18next';
import type { VehicleFormData } from '../../types';

interface VehicleBasicsStepProps {
  data: VehicleFormData;
  onChange: (updates: Partial<VehicleFormData>) => void;
}

export function VehicleBasicsStep({ data, onChange }: VehicleBasicsStepProps) {
  const { t } = useTranslation('vehicles');

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{t('form.steps.basics')}</h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">
            {t('form.fields.chassisNumber')} *
          </label>
          <input
            type="text"
            value={data.chassisNumber}
            onChange={(e) => onChange({ chassisNumber: e.target.value })}
            placeholder="e.g., WBADT43452G123456"
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            {t('form.fields.licensePlate')}
          </label>
          <input
            type="text"
            value={data.licensePlate}
            onChange={(e) => onChange({ licensePlate: e.target.value })}
            placeholder="e.g., ABC-1234"
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            {t('form.fields.make')} *
          </label>
          <input
            type="text"
            value={data.make}
            onChange={(e) => onChange({ make: e.target.value })}
            placeholder="e.g., BMW"
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            {t('form.fields.model')} *
          </label>
          <input
            type="text"
            value={data.model}
            onChange={(e) => onChange({ model: e.target.value })}
            placeholder="e.g., 3 Series"
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            {t('form.fields.year')}
          </label>
          <input
            type="number"
            value={data.year}
            onChange={(e) => onChange({ year: parseInt(e.target.value) })}
            min="1900"
            max={new Date().getFullYear()}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            {t('form.fields.color')}
          </label>
          <input
            type="text"
            value={data.color}
            onChange={(e) => onChange({ color: e.target.value })}
            placeholder="e.g., Black"
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground bg-muted p-3 rounded">
        {t('form.hints.basicStep')}
      </p>
    </div>
  );
}
