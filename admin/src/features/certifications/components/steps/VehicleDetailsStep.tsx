import { useTranslation } from 'react-i18next';
import { Hash, Settings, Gauge } from 'lucide-react';
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

const FUEL_TYPES = ['petrol', 'diesel', 'lpg', 'hybrid', 'electric', 'hydrogen'];

const inputClasses =
  'w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary';

const selectClasses =
  "w-full cursor-pointer appearance-none rounded-md border border-border bg-background bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[right_12px_center] bg-no-repeat px-3 py-2 pr-10 text-foreground focus:outline-none focus:ring-2 focus:ring-primary";

export function VehicleDetailsStep({ data, onChange }: VehicleDetailsStepProps) {
  const { t } = useTranslation('vehicles');

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">{t('form.steps.details')}</h3>

      {/* Section 1: Identification */}
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Hash className="h-4 w-4 text-primary" />
          <div>
            <h4 className="text-sm font-semibold">{t('form.sections.identification')}</h4>
            <p className="text-xs text-muted-foreground">{t('form.sections.identificationHint')}</p>
          </div>
        </div>
        <div className="p-4">
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
                className={inputClasses}
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
                className={inputClasses}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Body & Drivetrain */}
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Settings className="h-4 w-4 text-primary" />
          <div>
            <h4 className="text-sm font-semibold">{t('form.sections.bodyDrivetrain')}</h4>
            <p className="text-xs text-muted-foreground">{t('form.sections.bodyDrivetrainHint')}</p>
          </div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('form.fields.bodyType')} <span className="text-amber-500">*</span>
              </label>
              <select
                value={data.bodyType}
                onChange={(e) => onChange({ bodyType: e.target.value })}
                className={selectClasses}
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
                {t('form.fields.driveType')} <span className="text-amber-500">*</span>
              </label>
              <select
                value={data.driveType}
                onChange={(e) => onChange({ driveType: e.target.value })}
                className={selectClasses}
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
                className={selectClasses}
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
                className={selectClasses}
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
        </div>
      </div>

      {/* Section 3: Engine Specifications */}
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Gauge className="h-4 w-4 text-primary" />
          <div>
            <h4 className="text-sm font-semibold">{t('form.sections.engineSpecs')}</h4>
            <p className="text-xs text-muted-foreground">{t('form.sections.engineSpecsHint')}</p>
          </div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('form.fields.fuel')}
              </label>
              <select
                value={data.fuel}
                onChange={(e) => onChange({ fuel: e.target.value })}
                className={selectClasses}
              >
                <option value="">{t('form.placeholders.selectFuel')}</option>
                {FUEL_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {t(`form.options.fuelTypes.${type}`)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {t('form.fields.engineCylinders')}
              </label>
              <input
                type="number"
                value={data.engineCylinders ?? ''}
                onChange={(e) => onChange({ engineCylinders: e.target.value ? parseInt(e.target.value, 10) : null })}
                placeholder="e.g., 4"
                min="1"
                max="16"
                className={inputClasses}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {t('form.fields.engineCc')}
              </label>
              <div className="flex">
                <input
                  type="number"
                  value={data.engineCc ?? ''}
                  onChange={(e) => onChange({ engineCc: e.target.value ? parseInt(e.target.value, 10) : null })}
                  placeholder="e.g., 2000"
                  min="0"
                  className="flex-1 px-3 py-2 border border-border rounded-l-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="inline-flex items-center rounded-r-md border border-l-0 border-border bg-muted px-3 text-sm text-muted-foreground">
                  cc
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {t('form.fields.enginePowerHp')}
              </label>
              <div className="flex">
                <input
                  type="number"
                  value={data.enginePowerHp ?? ''}
                  onChange={(e) => onChange({ enginePowerHp: e.target.value ? parseInt(e.target.value, 10) : null })}
                  placeholder="e.g., 150"
                  min="0"
                  className="flex-1 px-3 py-2 border border-border rounded-l-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="inline-flex items-center rounded-r-md border border-l-0 border-border bg-muted px-3 text-sm text-muted-foreground">
                  HP
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
