import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { VehicleBasicsStep } from './steps/VehicleBasicsStep';
import { VehicleDetailsStep } from './steps/VehicleDetailsStep';
import { VehicleSummaryStep } from './steps/VehicleSummaryStep';
import { useCreateVehicles } from '../hooks/useVehicles';
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
  const [step, setStep] = useState<1 | 2 | 3>(1);
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
  });
  const [selectedEntity] = useState<string>(
    entities.length > 0 ? entities[0].id : ''
  );

  const { mutate: createVehicles, isPending } = useCreateVehicles();

  const handleNext = () => {
    if (step < 3) {
      setStep((step + 1) as 1 | 2 | 3);
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep((step - 1) as 1 | 2 | 3);
    }
  };

  const handleSubmit = () => {
    createVehicles(
      { vehicleData: formData, entityId: selectedEntity },
      {
        onSuccess: () => {
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
          });
        },
      }
    );
  };

  const isStep1Valid = formData.chassisNumber && formData.make && formData.model;
  const isStep2Valid = formData.bodyType && formData.driveType;
  const canProceedToStep2 = isStep1Valid;
  const canProceedToStep3 = isStep1Valid && isStep2Valid;

  return (
    <div className="w-full">
      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex items-center gap-2 ${s < 3 ? 'flex-1' : ''}`}
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
              {s < 3 && (
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
          className="flex items-center gap-2 px-4 py-2 border border-border rounded-md text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
          {t('form.actions.previous')}
        </button>

        {step < 3 ? (
          <button
            onClick={handleNext}
            disabled={!canProceedToStep2 || isPending}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('form.actions.next')}
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!canProceedToStep3 || isPending}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? t('form.actions.creating') : t('form.actions.create')}
          </button>
        )}
      </div>
    </div>
  );
}
