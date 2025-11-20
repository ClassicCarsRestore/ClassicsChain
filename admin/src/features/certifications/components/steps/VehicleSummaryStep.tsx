import { useTranslation } from 'react-i18next';
import type { VehicleFormData } from '../../types';

interface VehicleSummaryStepProps {
  data: VehicleFormData;
}

export function VehicleSummaryStep({
  data,
}: VehicleSummaryStepProps) {
  const { t } = useTranslation('vehicles');

  const sections = [
    {
      title: t('form.summary.identification'),
      fields: [
        { label: t('form.fields.licensePlate'), value: data.licensePlate },
        { label: t('form.fields.chassisNumber'), value: data.chassisNumber },
      ],
    },
    {
      title: t('form.summary.basicInfo'),
      fields: [
        { label: t('form.fields.make'), value: data.make },
        { label: t('form.fields.model'), value: data.model },
        { label: t('form.fields.year'), value: data.year.toString() },
        { label: t('form.fields.color'), value: data.color },
      ],
    },
    {
      title: t('form.summary.technical'),
      fields: [
        { label: t('form.fields.engineNumber'), value: data.engineNumber },
        {
          label: t('form.fields.transmissionNumber'),
          value: data.transmissionNumber,
        },
        { label: t('form.fields.bodyType'), value: data.bodyType },
        { label: t('form.fields.driveType'), value: data.driveType },
        { label: t('form.fields.gearType'), value: data.gearType },
        { label: t('form.fields.suspensionType'), value: data.suspensionType },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">{t('form.steps.summary')}</h3>

      {/* Vehicle Information */}
      {sections.map((section) => (
        <div key={section.title}>
          <h4 className="text-sm font-semibold text-muted-foreground mb-3">
            {section.title}
          </h4>
          <div className="grid grid-cols-2 gap-4">
            {section.fields.map((field) => (
              <div key={field.label}>
                <p className="text-xs text-muted-foreground">{field.label}</p>
                <p className="text-sm font-medium text-foreground">
                  {field.value || '-'}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Confirmation Message */}
      <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          {t('form.summary.confirmation')}
        </p>
      </div>
    </div>
  );
}
