import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
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
  ] as const;

  const driveTypes = ['fwd', 'rwd', 'awd', '4wd'] as const;
  const gearTypes = ['manual', 'automatic', 'cvt', 'dct', 'sequential'] as const;
  const suspensionTypes = [
    'independent',
    'dependent',
    'macpherson',
    'double_wishbone',
    'multi_link',
    'air_suspension',
  ] as const;

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
      <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card p-6">
        <div className="space-y-6">
          {/* Engine Number / License Plate - At least one required */}
          <div className="rounded-lg border border-border bg-muted/50 p-4">
                <p className="mb-4 text-xs font-medium text-muted-foreground">
                    {t('vehicleForm.fields.engineNumberOrLicensePlateHint')}
                </p>
                <div className="grid grid-cols-2 gap-4">
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
                            className={`mt-1 w-full rounded-md border ${
                                validationErrors.engineNumberOrLicensePlate ? 'border-red-500' : 'border-border'
                            } bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary`}
                        />
                    </div>

                    {/* License Plate */}
                    <div>
                        <label htmlFor="licensePlate" className="block text-sm font-medium text-foreground">
                            {t('dashboard:vehicleForm.fields.licensePlate')} <span className="text-amber-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="licensePlate"
                            name="licensePlate"
                            placeholder={t('dashboard:vehicleForm.fields.licensePlatePlaceholder')}
                            className={`mt-1 w-full rounded-md border ${
                                validationErrors.engineNumberOrLicensePlate ? 'border-red-500' : 'border-border'
                            } bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary`}
                        />
                    </div>
                </div>
                {validationErrors.engineNumberOrLicensePlate && (
                    <p className="mt-2 text-sm text-red-500">{validationErrors.engineNumberOrLicensePlate}</p>
                )}
            </div>

          {/* Make */}
          <div>
            <label htmlFor="make" className="block text-sm font-medium text-foreground">
              {t('vehicleForm.fields.make')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="make"
              name="make"
              placeholder={t('vehicleForm.fields.makePlaceholder')}
              className={`mt-1 w-full rounded-md border ${
                validationErrors.make ? 'border-red-500' : 'border-border'
              } bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary`}
            />
            {validationErrors.make && (
              <p className="mt-1 text-sm text-red-500">{validationErrors.make}</p>
            )}
          </div>

          {/* Model */}
          <div>
            <label htmlFor="model" className="block text-sm font-medium text-foreground">
              {t('vehicleForm.fields.model')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="model"
              name="model"
              placeholder={t('vehicleForm.fields.modelPlaceholder')}
              className={`mt-1 w-full rounded-md border ${
                validationErrors.model ? 'border-red-500' : 'border-border'
              } bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary`}
            />
            {validationErrors.model && (
              <p className="mt-1 text-sm text-red-500">{validationErrors.model}</p>
            )}
          </div>

          {/* Year */}
          <div>
            <label htmlFor="year" className="block text-sm font-medium text-foreground">
              {t('vehicleForm.fields.year')} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="year"
              name="year"
              placeholder={t('vehicleForm.fields.yearPlaceholder')}
              min="1800"
              max="9999"
              className={`mt-1 w-full rounded-md border ${
                validationErrors.year ? 'border-red-500' : 'border-border'
              } bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary`}
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
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Chassis Number */}
          <div>
            <label htmlFor="chassisNumber" className="block text-sm font-medium text-foreground">
              {t('dashboard:vehicleForm.fields.chassisNumber')}
            </label>
            <input
              type="text"
              id="chassisNumber"
              name="chassisNumber"
              placeholder={t('dashboard:vehicleForm.fields.chassisNumberPlaceholder')}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Transmission Number */}
          <div>
            <label htmlFor="transmissionNumber" className="block text-sm font-medium text-foreground">
              {t('dashboard:vehicleForm.fields.transmissionNumber')}
            </label>
            <input
              type="text"
              id="transmissionNumber"
              name="transmissionNumber"
              placeholder={t('dashboard:vehicleForm.fields.transmissionNumberPlaceholder')}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Body Type */}
          <div>
            <label htmlFor="bodyType" className="block text-sm font-medium text-foreground">
              {t('dashboard:vehicleForm.fields.bodyType')}
            </label>
            <select
              id="bodyType"
              name="bodyType"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">{t('dashboard:vehicleForm.fields.selectBodyType')}</option>
              {bodyTypes.map((type) => (
                <option key={type} value={type}>
                  {t(`dashboard:vehicleForm.bodyTypes.${type}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Drive Type */}
          <div>
            <label htmlFor="driveType" className="block text-sm font-medium text-foreground">
              {t('dashboard:vehicleForm.fields.driveType')}
            </label>
            <select
              id="driveType"
              name="driveType"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">{t('dashboard:vehicleForm.fields.selectDriveType')}</option>
              {driveTypes.map((type) => (
                <option key={type} value={type}>
                  {t(`dashboard:vehicleForm.driveTypes.${type}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Gear Type */}
          <div>
            <label htmlFor="gearType" className="block text-sm font-medium text-foreground">
              {t('dashboard:vehicleForm.fields.gearType')}
            </label>
            <select
              id="gearType"
              name="gearType"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">{t('dashboard:vehicleForm.fields.selectGearType')}</option>
              {gearTypes.map((type) => (
                <option key={type} value={type}>
                  {t(`dashboard:vehicleForm.gearTypes.${type}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Suspension Type */}
          <div>
            <label htmlFor="suspensionType" className="block text-sm font-medium text-foreground">
              {t('dashboard:vehicleForm.fields.suspensionType')}
            </label>
            <select
              id="suspensionType"
              name="suspensionType"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">{t('dashboard:vehicleForm.fields.selectSuspensionType')}</option>
              {suspensionTypes.map((type) => (
                <option key={type} value={type}>
                  {t(`dashboard:vehicleForm.suspensionTypes.${type}`)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Form Actions */}
        <div className="mt-8 flex gap-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            disabled={isSubmitting}
            className="flex-1 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50 cursor-pointer"
          >
            {t('vehicleForm.buttons.cancel')}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? t('vehicleForm.buttons.submitting') : t('vehicleForm.buttons.submit')}
          </button>
        </div>
      </form>
    </div>
  );
}
