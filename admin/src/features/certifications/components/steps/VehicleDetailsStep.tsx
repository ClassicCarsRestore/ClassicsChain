import { useTranslation } from 'react-i18next';
import type { VehicleFormData } from '../../types';

interface VehicleDetailsStepProps {
  data: VehicleFormData;
  onChange: (updates: Partial<VehicleFormData>) => void;
}

const BODY_TYPES = [
  'sedan',
  'coupe',
  'convertible',
  'suv',
  'truck',
  'van',
  'wagon',
  'hatchback',
  'minivan',
  'sports',
];

const DRIVE_TYPES = [
  'front_wheel_drive',
  'rear_wheel_drive',
  'all_wheel_drive',
  'four_wheel_drive',
];

const GEAR_TYPES = ['manual', 'automatic', 'cvt', 'semi-automatic'];

const SUSPENSION_TYPES = [
  'independent',
  'dependent',
  'macpherson',
  'double_wishbone',
  'multi_link',
  'air_suspension',
];

export function VehicleDetailsStep({ data, onChange }: VehicleDetailsStepProps) {
  const { t } = useTranslation('vehicles');

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{t('form.steps.details')}</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            {t('form.fields.engineNumber')}
          </label>
          <input
            type="text"
            value={data.engineNumber}
            onChange={(e) => onChange({ engineNumber: e.target.value })}
            placeholder="e.g., N57D30TOP1234567"
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            {t('form.fields.transmissionNumber')}
          </label>
          <input
            type="text"
            value={data.transmissionNumber}
            onChange={(e) => onChange({ transmissionNumber: e.target.value })}
            placeholder="e.g., 6HP281234567"
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            {t('form.fields.bodyType')} *
          </label>
          <select
            value={data.bodyType}
            onChange={(e) => onChange({ bodyType: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">{t('form.placeholders.selectBodyType')}</option>
            {BODY_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`form.options.bodyTypes.${type}`)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            {t('form.fields.driveType')} *
          </label>
          <select
            value={data.driveType}
            onChange={(e) => onChange({ driveType: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">{t('form.placeholders.selectDriveType')}</option>
            {DRIVE_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`form.options.driveTypes.${type}`)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            {t('form.fields.gearType')}
          </label>
          <select
            value={data.gearType}
            onChange={(e) => onChange({ gearType: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">{t('form.placeholders.selectGearType')}</option>
            {GEAR_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`form.options.gearTypes.${type}`)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            {t('form.fields.suspensionType')}
          </label>
          <select
            value={data.suspensionType}
            onChange={(e) => onChange({ suspensionType: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">{t('form.placeholders.selectSuspensionType')}</option>
            {SUSPENSION_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`form.options.suspensionTypes.${type}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-xs text-muted-foreground bg-muted p-3 rounded">
        {t('form.hints.detailsStep')}
      </p>
    </div>
  );
}
