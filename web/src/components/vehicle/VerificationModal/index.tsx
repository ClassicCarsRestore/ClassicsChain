import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { IntroStep } from './steps/IntroStep';
import { EventDataStep } from './steps/EventDataStep';
import { CBORStep } from './steps/CBORStep';
import { HashingStep } from './steps/HashingStep';
import { CIDStep } from './steps/CIDStep';
import { BlockchainStep } from './steps/BlockchainStep';
import { VerifiedStep } from './steps/VerifiedStep';

export interface VerificationData {
  eventTitle: string;
  eventDate: string;
  cidSourceJSON: string;
  cidSourceCBOR: string;
  cid: string;
  blockchainTxId: string;
  network: string;
}

interface VerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: VerificationData;
}

const TOTAL_STEPS = 7;

export function VerificationModal({ open, onOpenChange, data }: VerificationModalProps) {
  const { t } = useTranslation('verification');
  const [currentStep, setCurrentStep] = useState(1);

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    onOpenChange(false);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <IntroStep onNext={handleNext} />;
      case 2:
        return <EventDataStep data={data} onNext={handleNext} onBack={handleBack} />;
      case 3:
        return <CBORStep data={data} onNext={handleNext} onBack={handleBack} />;
      case 4:
        return <HashingStep data={data} onNext={handleNext} onBack={handleBack} />;
      case 5:
        return <CIDStep data={data} onNext={handleNext} onBack={handleBack} />;
      case 6:
        return <BlockchainStep data={data} onNext={handleNext} onBack={handleBack} />;
      case 7:
        return <VerifiedStep data={data} onDone={handleClose} />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogTitle className="sr-only">{t('title')}</DialogTitle>

        {currentStep < TOTAL_STEPS && (
          <StepIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS - 1} />
        )}

        {renderStep()}
      </DialogContent>
    </Dialog>
  );
}

function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="mb-6">
      <p className="text-sm text-muted-foreground mb-3">
        Step {currentStep} of {totalSteps}
      </p>
      <div className="flex w-full items-center">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div key={index} className={`flex items-center ${index < totalSteps - 1 ? 'flex-1' : ''}`}>
            <div
              className={`h-2.5 w-2.5 flex-shrink-0 rounded-full transition-colors ${
                index < currentStep ? 'bg-primary' : 'bg-muted'
              }`}
            />
            {index < totalSteps - 1 && (
              <div
                className={`h-0.5 flex-1 transition-colors ${
                  index < currentStep - 1 ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
