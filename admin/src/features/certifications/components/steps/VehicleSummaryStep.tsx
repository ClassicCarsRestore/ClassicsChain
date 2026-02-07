import { useTranslation } from 'react-i18next';
import { Mail, UserPlus } from 'lucide-react';
import type { VehicleFormData } from '../../types';

interface VehicleSummaryStepProps {
  data: VehicleFormData;
}

export function VehicleSummaryStep({
  data,
}: VehicleSummaryStepProps) {
  const { t } = useTranslation('vehicles');

  const hasOwnerEmail = data.ownerEmail && data.ownerEmail.trim() !== '';

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
        { label: t('form.fields.bodyType'), value: data.bodyType ? t(`form.options.bodyTypes.${data.bodyType}`, { defaultValue: data.bodyType }) : '' },
        { label: t('form.fields.driveType'), value: data.driveType ? t(`form.options.driveTypes.${data.driveType}`, { defaultValue: data.driveType }) : '' },
        { label: t('form.fields.gearType'), value: data.gearType ? t(`form.options.gearTypes.${data.gearType}`, { defaultValue: data.gearType }) : '' },
        { label: t('form.fields.suspensionType'), value: data.suspensionType ? t(`form.options.suspensionTypes.${data.suspensionType}`, { defaultValue: data.suspensionType }) : '' },
        { label: t('form.fields.fuel'), value: data.fuel ? t(`form.options.fuelTypes.${data.fuel}`, { defaultValue: data.fuel }) : '' },
        { label: t('form.fields.engineCc'), value: data.engineCc ? `${data.engineCc} cc` : '' },
        { label: t('form.fields.engineCylinders'), value: data.engineCylinders?.toString() || '' },
        { label: t('form.fields.enginePowerHp'), value: data.enginePowerHp ? `${data.enginePowerHp} HP` : '' },
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

      {/* Owner Assignment */}
      <div>
        <h4 className="text-sm font-semibold text-muted-foreground mb-3">
          {t('ownerAssignment.title', 'Owner Assignment')}
        </h4>
        {hasOwnerEmail ? (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 mb-2">
              <Mail className="h-4 w-4" />
              <span className="font-medium">{t('ownerAssignment.invitationWillBeSent', 'Invitation will be sent')}</span>
            </div>
            <p className="text-sm text-amber-600 dark:text-amber-500">
              {t('ownerAssignment.invitationDescription', 'An ownership invitation will be sent to:')}
            </p>
            <code className="text-sm font-mono text-amber-700 dark:text-amber-400 mt-1 block">
              {data.ownerEmail}
            </code>
          </div>
        ) : (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400 mb-2">
              <UserPlus className="h-4 w-4" />
              <span className="font-medium">{t('ownerAssignment.orphaned', 'Orphaned Vehicle')}</span>
            </div>
            <p className="text-sm text-yellow-600 dark:text-yellow-500">
              {t('ownerAssignment.orphanedDescription', 'No owner email provided. This vehicle will be created in orphaned state and can be claimed by any user with matching identifiers.')}
            </p>
          </div>
        )}
      </div>

      {/* Confirmation Message */}
      <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          {hasOwnerEmail
            ? t('form.summary.confirmationWithOwner', 'Please review the vehicle information. After creation, an invitation email will be sent to the specified owner.')
            : t('form.summary.confirmation')}
        </p>
      </div>
    </div>
  );
}
