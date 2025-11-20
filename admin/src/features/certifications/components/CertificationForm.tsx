import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2 } from 'lucide-react';
import { useCreateEvent } from '../hooks/useVehicles';
import type { CertificationEventMetadata } from '../types';

interface Entity {
  id: string;
  name: string;
  type: string;
}

interface CertificationFormProps {
  vehicleId: string;
  entities: Entity[];
  onSuccess?: () => void;
}

interface ValidityDuration {
  years: number;
  months: number;
  days: number;
}

export function CertificationForm({ vehicleId, entities, onSuccess }: CertificationFormProps) {
  const { t } = useTranslation('vehicles');
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  const [metadata, setMetadata] = useState<CertificationEventMetadata>({
    certificateNumber: '',
    conditionAssessment: '',
    documentationReferences: [],
  });
  const [setValidity, setSetValidity] = useState(false);
  const [duration, setDuration] = useState<ValidityDuration>({
    years: 1,
    months: 0,
    days: 0,
  });
  const [newReference, setNewReference] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Auto-select entity if only one exists
  useEffect(() => {
    if (entities.length === 1) {
      setSelectedEntity(entities[0].id);
    }
  }, [entities]);

  const { mutate: createEvent, isPending } = useCreateEvent();

  // Calculate validity end date based on duration
  const calculateEndDate = (durationObj: ValidityDuration): string => {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setUTCFullYear(endDate.getUTCFullYear() + durationObj.years);
    endDate.setUTCMonth(endDate.getUTCMonth() + durationObj.months);
    endDate.setUTCDate(endDate.getUTCDate() + durationObj.days);
    return endDate.toISOString().split('T')[0];
  };

  const handleAddReference = () => {
    if (newReference.trim()) {
      setMetadata((prev) => ({
        ...prev,
        documentationReferences: [...prev.documentationReferences, newReference],
      }));
      setNewReference('');
    }
  };

  const handleRemoveReference = (index: number) => {
    setMetadata((prev) => ({
      ...prev,
      documentationReferences: prev.documentationReferences.filter(
        (_, i) => i !== index
      ),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Prepare metadata with optional validity end date
    const submissionMetadata: CertificationEventMetadata = {
      ...metadata,
    };

    if (setValidity) {
      submissionMetadata.validityEndDate = calculateEndDate(duration);
    }

    createEvent(
      {
        vehicleId,
        entityId: selectedEntity,
        title,
        description,
        type: 'certification',
        metadata: submissionMetadata,
      },
      {
        onSuccess: () => {
          // Reset form
          setTitle('');
          setDescription('');
          setMetadata({
            certificateNumber: '',
            conditionAssessment: '',
            documentationReferences: [],
          });
          setSetValidity(false);
          setDuration({ years: 1, months: 0, days: 0 });
          setNewReference('');
          // Close modal
          onSuccess?.();
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Entity Selection - Hidden temporarily, auto-selected */}
      {false && (
        <div>
          <label className="block text-sm font-medium mb-2">
            {t('form.entity')} *
          </label>
          <select
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            disabled={entities.length === 1}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            required
          >
            {entities.length > 1 && (
              <option value="">Select an entity...</option>
            )}
            {entities.map((entity) => (
              <option key={entity.id} value={entity.id}>
                {entity.name}
              </option>
            ))}
          </select>
          {entities.length === 1 && (
            <p className="text-xs text-muted-foreground mt-1">
              Automatically selected (only entity available)
            </p>
          )}
        </div>
      )}

      {/* Basic Information */}
      <div>
        {/*<h3 className="text-sm font-semibold text-muted-foreground mb-3">*/}
        {/*  {t('certification.section.basic')}*/}
        {/*</h3>*/}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('certification.fields.title')} *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Technical Inspection"
              required
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('certification.fields.description')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter details about this certification..."
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
        </div>

          <div>
              <label className="block text-sm font-medium mb-1">
                  {t('certification.fields.certificateNumber')} *
              </label>
              <input
                  type="text"
                  value={metadata.certificateNumber}
                  onChange={(e) =>
                      setMetadata((prev) => ({
                          ...prev,
                          certificateNumber: e.target.value,
                      }))
                  }
                  placeholder="e.g., CERT-2024-001234"
                  required
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
          </div>

          {/* Validity Period Section */}
          <div className="pt-2 border-t border-border">
              <label className="flex items-center gap-2 cursor-pointer mb-3">
                  <input
                      type="checkbox"
                      checked={setValidity}
                      onChange={(e) => setSetValidity(e.target.checked)}
                      className="w-4 h-4 border border-border rounded cursor-pointer"
                  />
                  <span className="text-sm font-medium">
                {t('certification.fields.setValidity')}
              </span>
              </label>

              {setValidity && (
                  <div className="space-y-3 p-3 bg-muted rounded-lg">
                      <div>
                          <label className="block text-xs font-semibold text-muted-foreground mb-2">
                              {t('certification.fields.validityDuration')}
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                              <div>
                                  <label className="block text-xs text-muted-foreground mb-1">
                                      {t('certification.fields.years')}
                                  </label>
                                  <input
                                      type="number"
                                      min="0"
                                      max="50"
                                      value={duration.years}
                                      onChange={(e) =>
                                          setDuration((prev) => ({
                                              ...prev,
                                              years: Math.max(0, parseInt(e.target.value) || 0),
                                          }))
                                      }
                                      className="w-full px-2 py-1 border border-border rounded text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                  />
                              </div>
                              <div>
                                  <label className="block text-xs text-muted-foreground mb-1">
                                      {t('certification.fields.months')}
                                  </label>
                                  <input
                                      type="number"
                                      min="0"
                                      max="11"
                                      value={duration.months}
                                      onChange={(e) =>
                                          setDuration((prev) => ({
                                              ...prev,
                                              months: Math.max(
                                                  0,
                                                  Math.min(11, parseInt(e.target.value) || 0)
                                              ),
                                          }))
                                      }
                                      className="w-full px-2 py-1 border border-border rounded text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                  />
                              </div>
                              <div>
                                  <label className="block text-xs text-muted-foreground mb-1">
                                      {t('certification.fields.days')}
                                  </label>
                                  <input
                                      type="number"
                                      min="0"
                                      max="31"
                                      value={duration.days}
                                      onChange={(e) =>
                                          setDuration((prev) => ({
                                              ...prev,
                                              days: Math.max(
                                                  0,
                                                  Math.min(31, parseInt(e.target.value) || 0)
                                              ),
                                          }))
                                      }
                                      className="w-full px-2 py-1 border border-border rounded text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                  />
                              </div>
                          </div>
                      </div>

                      {/* Calculated End Date Display */}
                      <div className="p-2 bg-background rounded border border-border">
                          <p className="text-xs text-muted-foreground mb-1">
                              {t('certification.fields.validityEndDate')}
                          </p>
                          <p className="text-sm font-semibold text-foreground">
                              {calculateEndDate(duration)}
                          </p>
                      </div>

                      <p className="text-xs text-muted-foreground">
                          {t('certification.hints.validityOptional')}
                      </p>
                  </div>
              )}
          </div>

          <div>
              <label className="block text-sm font-medium mb-1">
                  {t('certification.fields.conditionAssessment')}
              </label>
              <textarea
                  value={metadata.conditionAssessment}
                  onChange={(e) =>
                      setMetadata((prev) => ({
                          ...prev,
                          conditionAssessment: e.target.value,
                      }))
                  }
                  placeholder="Describe the overall condition of the vehicle..."
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
          </div>

          <div className="flex gap-2">
              <input
                  type="text"
                  value={newReference}
                  onChange={(e) => setNewReference(e.target.value)}
                  placeholder="e.g., Report ID, Document URL, etc."
                  className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                  type="button"
                  onClick={handleAddReference}
                  className="flex items-center gap-2 px-3 py-2 border border-border rounded-md bg-background text-foreground hover:bg-muted"
              >
                  <Plus className="w-4 h-4" />
                  {t('certification.actions.addReference')}
              </button>
          </div>

          {metadata.documentationReferences.length > 0 && (
              <div className="space-y-2">
                  {metadata.documentationReferences.map((ref, index) => (
                      <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-muted rounded"
                      >
                          <code className="text-xs">{ref}</code>
                          <button
                              type="button"
                              onClick={() => handleRemoveReference(index)}
                              className="p-1 text-destructive hover:bg-destructive/10 rounded"
                          >
                              <Trash2 className="w-4 h-4" />
                          </button>
                      </div>
                  ))}
              </div>
          )}
      </div>


      {/* Submit Button */}
      <div className="flex gap-2 pt-4 border-t border-border">
        <button
          type="submit"
          disabled={isPending || !title || !metadata.certificateNumber}
          className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {isPending
            ? t('certification.actions.creating')
            : t('certification.actions.create')}
        </button>
      </div>
    </form>
  );
}
