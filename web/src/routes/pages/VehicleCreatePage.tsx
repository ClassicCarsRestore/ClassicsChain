import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Car, Hash, Settings, Gauge, ChevronDown } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { CreateVehicleRequest } from '@/types/vehicle';

export function VehicleCreatePage() {
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateForm = (formData: FormData): boolean => {
    const errors: Record<string, string> = {};
    const make = formData.get('make') as string;
    const model = formData.get('model') as string;
    const year = formData.get('year') as string;
    const engineNumber = formData.get('engineNumber') as string;
    const licensePlate = formData.get('licensePlate') as string;

    if (!make?.trim()) {
      errors.make = t('vehicleForm.validation.makeRequired');
    }
    if (!model?.trim()) {
      errors.model = t('vehicleForm.validation.modelRequired');
    }
    if (!year?.trim()) {
      errors.year = t('vehicleForm.validation.yearRequired');
    } else {
      const yearNum = parseInt(year, 10);
      if (isNaN(yearNum) || yearNum < 1800 || yearNum > 9999) {
        errors.year = t('vehicleForm.validation.yearInvalid');
      }
    }

    if (!engineNumber?.trim() && !licensePlate?.trim()) {
      errors.engineNumberOrLicensePlate = t('vehicleForm.validation.engineNumberOrLicensePlateRequired');
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const bodyTypes = [
    'sedan',
    'coupe',
    'convertible',
    'wagon',
    'suv',
    'truck',
    'van',
    'hatchback',
    'roadster',
    'minivan',
    'sports',
  ] as const;

  const driveTypes = ['front_wheel_drive', 'rear_wheel_drive', 'all_wheel_drive', 'four_wheel_drive'] as const;
  const gearTypes = ['manual', 'automatic', 'cvt', 'semi-automatic'] as const;
  const suspensionTypes = [
    'independent',
    'dependent',
    'macpherson',
    'double_wishbone',
    'multi_link',
    'air_suspension',
  ] as const;

  const fuelTypes = ['petrol', 'diesel', 'lpg', 'hybrid', 'electric', 'hydrogen'] as const;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setValidationErrors({});

    const formData = new FormData(e.currentTarget);

    if (!validateForm(formData)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const vehicleData: CreateVehicleRequest = {
        licensePlate: (formData.get('licensePlate') as string) || undefined,
        chassisNumber: (formData.get('chassisNumber') as string) || undefined,
        make: formData.get('make') as string,
        model: formData.get('model') as string,
        year: parseInt(formData.get('year') as string, 10),
        color: (formData.get('color') as string) || undefined,
        engineNumber: (formData.get('engineNumber') as string) || undefined,
        transmissionNumber: (formData.get('transmissionNumber') as string) || undefined,
        bodyType: (formData.get('bodyType') as string) || undefined,
        driveType: (formData.get('driveType') as string) || undefined,
        gearType: (formData.get('gearType') as string) || undefined,
        suspensionType: (formData.get('suspensionType') as string) || undefined,
        fuel: (formData.get('fuel') as string) || undefined,
        engineCc: formData.get('engineCc') ? parseInt(formData.get('engineCc') as string, 10) : undefined,
        engineCylinders: formData.get('engineCylinders') ? parseInt(formData.get('engineCylinders') as string, 10) : undefined,
        enginePowerHp: formData.get('enginePowerHp') ? parseInt(formData.get('enginePowerHp') as string, 10) : undefined,
      };

      const response = await api.post('/v1/vehicles', vehicleData);
      const vehicle = response as { id: string };
      navigate(`/vehicles/${vehicle.id}`);
    } catch (err) {
      console.error('Failed to create vehicle:', err);
      setError(t('vehicleForm.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses = (hasError: boolean) =>
    `mt-1 w-full rounded-md border ${hasError ? 'border-red-500' : 'border-border'} bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary`;

  const selectClasses =
    "mt-1 w-full cursor-pointer appearance-none rounded-md border border-border bg-background bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[right_12px_center] bg-no-repeat px-3 py-2 pr-10 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-4 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('vehicle:buttons.backToDashboard')}
        </button>
        <h1 className="text-3xl font-bold text-foreground">{t('vehicleForm.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('vehicleForm.subtitle')}</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-500/50 bg-red-500/10 p-4">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Vehicle Identification */}
        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Hash className="h-4 w-4 text-primary" />
            <div>
              <h2 className="text-sm font-semibold">{t('vehicleForm.sections.identification')}</h2>
              <p className="text-xs text-muted-foreground">{t('vehicleForm.sections.identificationHint')}</p>
            </div>
          </div>
          <div className="space-y-4 p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Engine Number */}
              <div>
                <label htmlFor="engineNumber" className="block text-sm font-medium text-foreground">
                  {t('vehicleForm.fields.engineNumber')} <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  id="engineNumber"
                  name="engineNumber"
                  placeholder={t('vehicleForm.fields.engineNumberPlaceholder')}
                  className={inputClasses(!!validationErrors.engineNumberOrLicensePlate)}
                />
              </div>

              {/* License Plate */}
              <div>
                <label htmlFor="licensePlate" className="block text-sm font-medium text-foreground">
                  {t('vehicleForm.fields.licensePlate')} <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  id="licensePlate"
                  name="licensePlate"
                  placeholder={t('vehicleForm.fields.licensePlatePlaceholder')}
                  className={inputClasses(!!validationErrors.engineNumberOrLicensePlate)}
                />
              </div>
            </div>

            {validationErrors.engineNumberOrLicensePlate && (
              <p className="text-sm text-red-500">{validationErrors.engineNumberOrLicensePlate}</p>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Chassis Number */}
              <div>
                <label htmlFor="chassisNumber" className="block text-sm font-medium text-foreground">
                  {t('vehicleForm.fields.chassisNumber')}
                </label>
                <input
                  type="text"
                  id="chassisNumber"
                  name="chassisNumber"
                  placeholder={t('vehicleForm.fields.chassisNumberPlaceholder')}
                  className={inputClasses(false)}
                />
              </div>

              {/* Transmission Number */}
              <div>
                <label htmlFor="transmissionNumber" className="block text-sm font-medium text-foreground">
                  {t('vehicleForm.fields.transmissionNumber')}
                </label>
                <input
                  type="text"
                  id="transmissionNumber"
                  name="transmissionNumber"
                  placeholder={t('vehicleForm.fields.transmissionNumberPlaceholder')}
                  className={inputClasses(false)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Basic Information */}
        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Car className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">{t('vehicleForm.sections.basicInfo')}</h2>
          </div>
          <div className="space-y-4 p-4">
            {/* Make */}
            <div>
              <label htmlFor="make" className="block text-sm font-medium text-foreground">
                {t('vehicleForm.fields.make')} <span className="text-amber-500">*</span>
              </label>
              <input
                type="text"
                id="make"
                name="make"
                placeholder={t('vehicleForm.fields.makePlaceholder')}
                className={inputClasses(!!validationErrors.make)}
              />
              {validationErrors.make && (
                <p className="mt-1 text-sm text-red-500">{validationErrors.make}</p>
              )}
            </div>

            {/* Model */}
            <div>
              <label htmlFor="model" className="block text-sm font-medium text-foreground">
                {t('vehicleForm.fields.model')} <span className="text-amber-500">*</span>
              </label>
              <input
                type="text"
                id="model"
                name="model"
                placeholder={t('vehicleForm.fields.modelPlaceholder')}
                className={inputClasses(!!validationErrors.model)}
              />
              {validationErrors.model && (
                <p className="mt-1 text-sm text-red-500">{validationErrors.model}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Year */}
              <div>
                <label htmlFor="year" className="block text-sm font-medium text-foreground">
                  {t('vehicleForm.fields.year')} <span className="text-amber-500">*</span>
                </label>
                <input
                  type="number"
                  id="year"
                  name="year"
                  placeholder={t('vehicleForm.fields.yearPlaceholder')}
                  min="1800"
                  max="9999"
                  className={inputClasses(!!validationErrors.year)}
                />
                {validationErrors.year && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.year}</p>
                )}
              </div>

              {/* Color */}
              <div>
                <label htmlFor="color" className="block text-sm font-medium text-foreground">
                  {t('vehicleForm.fields.color')}
                </label>
                <input
                  type="text"
                  id="color"
                  name="color"
                  placeholder={t('vehicleForm.fields.colorPlaceholder')}
                  className={inputClasses(false)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Body & Drivetrain (Collapsible) */}
        <Collapsible defaultOpen={false}>
          <div className="rounded-lg border border-border bg-card">
            <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between px-4 py-3 hover:bg-muted/50">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-primary" />
                <div className="text-left">
                  <h2 className="text-sm font-semibold">{t('vehicleForm.sections.bodyDrivetrain')}</h2>
                  <p className="text-xs text-muted-foreground">{t('vehicleForm.sections.bodyDrivetrainHint')}</p>
                </div>
              </div>
              <ChevronDown className="h-4 w-4 transition-transform [[data-state=open]_&]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-4 border-t border-border p-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Body Type */}
                  <div>
                    <label htmlFor="bodyType" className="block text-sm font-medium text-foreground">
                      {t('vehicleForm.fields.bodyType')}
                    </label>
                    <select id="bodyType" name="bodyType" className={selectClasses}>
                      <option value="">{t('vehicleForm.fields.selectBodyType')}</option>
                      {bodyTypes.map((type) => (
                        <option key={type} value={type}>
                          {t(`vehicleForm.bodyTypes.${type}`)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Drive Type */}
                  <div>
                    <label htmlFor="driveType" className="block text-sm font-medium text-foreground">
                      {t('vehicleForm.fields.driveType')}
                    </label>
                    <select id="driveType" name="driveType" className={selectClasses}>
                      <option value="">{t('vehicleForm.fields.selectDriveType')}</option>
                      {driveTypes.map((type) => (
                        <option key={type} value={type}>
                          {t(`vehicleForm.driveTypes.${type}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Gear Type */}
                  <div>
                    <label htmlFor="gearType" className="block text-sm font-medium text-foreground">
                      {t('vehicleForm.fields.gearType')}
                    </label>
                    <select id="gearType" name="gearType" className={selectClasses}>
                      <option value="">{t('vehicleForm.fields.selectGearType')}</option>
                      {gearTypes.map((type) => (
                        <option key={type} value={type}>
                          {t(`vehicleForm.gearTypes.${type}`)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Suspension Type */}
                  <div>
                    <label htmlFor="suspensionType" className="block text-sm font-medium text-foreground">
                      {t('vehicleForm.fields.suspensionType')}
                    </label>
                    <select id="suspensionType" name="suspensionType" className={selectClasses}>
                      <option value="">{t('vehicleForm.fields.selectSuspensionType')}</option>
                      {suspensionTypes.map((type) => (
                        <option key={type} value={type}>
                          {t(`vehicleForm.suspensionTypes.${type}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* Section 4: Engine Specifications (Collapsible) */}
        <Collapsible defaultOpen={false}>
          <div className="rounded-lg border border-border bg-card">
            <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between px-4 py-3 hover:bg-muted/50">
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-primary" />
                <div className="text-left">
                  <h2 className="text-sm font-semibold">{t('vehicleForm.sections.engineSpecs')}</h2>
                  <p className="text-xs text-muted-foreground">{t('vehicleForm.sections.engineSpecsHint')}</p>
                </div>
              </div>
              <ChevronDown className="h-4 w-4 transition-transform [[data-state=open]_&]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-4 border-t border-border p-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Fuel Type */}
                  <div>
                    <label htmlFor="fuel" className="block text-sm font-medium text-foreground">
                      {t('vehicleForm.fields.fuel')}
                    </label>
                    <select id="fuel" name="fuel" className={selectClasses}>
                      <option value="">{t('vehicleForm.fields.selectFuel')}</option>
                      {fuelTypes.map((type) => (
                        <option key={type} value={type}>
                          {t(`vehicleForm.fuelTypes.${type}`)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Engine Cylinders */}
                  <div>
                    <label htmlFor="engineCylinders" className="block text-sm font-medium text-foreground">
                      {t('vehicleForm.fields.engineCylinders')}
                    </label>
                    <input
                      type="number"
                      id="engineCylinders"
                      name="engineCylinders"
                      placeholder={t('vehicleForm.fields.engineCylindersPlaceholder')}
                      min="1"
                      max="16"
                      className={inputClasses(false)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Engine Displacement */}
                  <div>
                    <label htmlFor="engineCc" className="block text-sm font-medium text-foreground">
                      {t('vehicleForm.fields.engineCc')}
                    </label>
                    <div className="mt-1 flex">
                      <input
                        type="number"
                        id="engineCc"
                        name="engineCc"
                        placeholder={t('vehicleForm.fields.engineCcPlaceholder')}
                        min="0"
                        className="w-full rounded-l-md border border-border bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <span className="inline-flex items-center rounded-r-md border border-l-0 border-border bg-muted px-3 text-sm text-muted-foreground">
                        cc
                      </span>
                    </div>
                  </div>

                  {/* Engine Power */}
                  <div>
                    <label htmlFor="enginePowerHp" className="block text-sm font-medium text-foreground">
                      {t('vehicleForm.fields.enginePowerHp')}
                    </label>
                    <div className="mt-1 flex">
                      <input
                        type="number"
                        id="enginePowerHp"
                        name="enginePowerHp"
                        placeholder={t('vehicleForm.fields.enginePowerHpPlaceholder')}
                        min="0"
                        className="w-full rounded-l-md border border-border bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <span className="inline-flex items-center rounded-r-md border border-l-0 border-border bg-muted px-3 text-sm text-muted-foreground">
                        HP
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* Form Actions */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/dashboard')}
            disabled={isSubmitting}
            className="flex-1"
          >
            {t('vehicleForm.buttons.cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? t('vehicleForm.buttons.submitting') : t('vehicleForm.buttons.submit')}
          </Button>
        </div>
      </form>
    </div>
  );
}
