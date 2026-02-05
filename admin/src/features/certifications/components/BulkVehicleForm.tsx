import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { VehicleBasicsStep } from './steps/VehicleBasicsStep';
import { VehicleDetailsStep } from './steps/VehicleDetailsStep';
import { VehicleSummaryStep } from './steps/VehicleSummaryStep';
import { OwnerAssignmentStep } from './steps/OwnerAssignmentStep';
import { useCreateVehicles } from '../hooks/useVehicles';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import type { VehicleFormData } from '../types';

interface Entity {
  id: string;
  name: string;
  type: string;
}

interface BulkVehicleFormProps {
  entities: Entity[];
  onSuccess: () => void;
}

export function BulkVehicleForm({ entities, onSuccess }: BulkVehicleFormProps) {
  const { t } = useTranslation('vehicles');
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [formData, setFormData] = useState<VehicleFormData>({
    licensePlate: '',
    chassisNumber: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    engineNumber: '',
    transmissionNumber: '',
    bodyType: '',
    driveType: '',
    gearType: '',
    suspensionType: '',
    ownerEmail: '',
  });
  const [selectedEntity] = useState<string>(
    entities.length > 0 ? entities[0].id : ''
  );

  const { mutate: createVehicles, isPending } = useCreateVehicles();

  const handleNext = () => {
    if (step < 4) {
      setStep((step + 1) as 1 | 2 | 3 | 4);
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep((step - 1) as 1 | 2 | 3 | 4);
    }
  };

  const handleSubmit = () => {
    createVehicles(
      { vehicleData: formData, entityId: selectedEntity },
      {
        onSuccess: () => {
          toast.success(t('toast.vehicleCreated', 'Vehicle created successfully'));
          onSuccess();
          // Reset form
          setStep(1);
          setFormData({
            licensePlate: '',
            chassisNumber: '',
            make: '',
            model: '',
            year: new Date().getFullYear(),
            color: '',
            engineNumber: '',
            transmissionNumber: '',
            bodyType: '',
            driveType: '',
            gearType: '',
            suspensionType: '',
            ownerEmail: '',
          });
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : t('toast.vehicleError', 'Failed to create vehicle'));
        },
      }
    );
  };

  const isStep1Valid = formData.chassisNumber && formData.make && formData.model;
  const isStep2Valid = formData.bodyType && formData.driveType;
  const canProceedToStep2 = isStep1Valid;
  const canProceedToStep3 = isStep1Valid && isStep2Valid;
  const canProceedToStep4 = canProceedToStep3;

  if (isPending) {
    return (
      <LoadingSpinner
        message={t('form.actions.creating')}
      />
    );
  }

  return (
    <div className="w-full">
      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex items-center gap-2 ${s < 4 ? 'flex-1' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                  step >= s
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
              </div>
              {s < 4 && (
                <div
                  className={`flex-1 h-1 mx-2 transition-all ${
                    step > s ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs font-medium text-muted-foreground">
          <span>{t('form.steps.basics')}</span>
          <span>{t('form.steps.details')}</span>
          <span>{t('form.steps.owner', 'Owner')}</span>
          <span>{t('form.steps.summary')}</span>
        </div>
      </div>

      {/* Entity Selection (visible on all steps) */}
      {/*<div className="mb-6 p-4 bg-muted rounded-lg">*/}
      {/*  <label className="block text-sm font-medium mb-2">*/}
      {/*    {t('form.entity')} **/}
      {/*  </label>*/}
      {/*  <select*/}
      {/*    value={selectedEntity}*/}
      {/*    onChange={(e) => setSelectedEntity(e.target.value)}*/}
      {/*    disabled={entities.length === 1 || isPending}*/}
      {/*    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground disabled:opacity-50 disabled:cursor-not-allowed"*/}
      {/*    required*/}
      {/*  >*/}
      {/*    {entities.length > 1 && (*/}
      {/*      <option value="">Select an entity...</option>*/}
      {/*    )}*/}
      {/*    {entities.map((entity) => (*/}
      {/*      <option key={entity.id} value={entity.id}>*/}
      {/*        {entity.name}*/}
      {/*      </option>*/}
      {/*    ))}*/}
      {/*  </select>*/}
      {/*  {entities.length === 1 && (*/}
      {/*    <p className="text-xs text-muted-foreground mt-1">*/}
      {/*      Automatically selected (only entity available)*/}
      {/*    </p>*/}
      {/*  )}*/}
      {/*</div>*/}

      {/* Step Content */}
      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        {step === 1 && (
          <VehicleBasicsStep
            data={formData}
            onChange={(updates) =>
              setFormData((prev) => ({ ...prev, ...updates }))
            }
          />
        )}
        {step === 2 && (
          <VehicleDetailsStep
            data={formData}
            onChange={(updates) =>
              setFormData((prev) => ({ ...prev, ...updates }))
            }
          />
        )}
        {step === 3 && (
          <OwnerAssignmentStep
            ownerEmail={formData.ownerEmail || ''}
            onChange={(email) =>
              setFormData((prev) => ({ ...prev, ownerEmail: email }))
            }
          />
        )}
        {step === 4 && (
          <VehicleSummaryStep
            data={formData}
          />
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between gap-4">
        <button
          onClick={handlePrevious}
          disabled={step === 1 || isPending}
          className="flex items-center gap-2 px-4 py-2 border border-border rounded-md text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          {t('form.actions.previous')}
        </button>

        {step < 4 ? (
          <button
            onClick={handleNext}
            disabled={(step === 1 && !canProceedToStep2) || (step === 2 && !canProceedToStep3) || isPending}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {t('form.actions.next')}
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!canProceedToStep4 || isPending}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isPending ? t('form.actions.creating') : t('form.actions.create')}
          </button>
        )}
      </div>
    </div>
  );
}
