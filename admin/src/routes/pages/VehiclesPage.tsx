import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { BulkVehicleForm } from '@/features/certifications/components/BulkVehicleForm';
import { VehiclesList } from '@/features/certifications/components/VehiclesList';

type Section = 'create' | 'browse';

export function VehiclesPage() {
  const { t } = useTranslation('vehicles');
  const { getUserEntities } = useAuth();
  const [activeSection, setActiveSection] = useState<Section>('browse');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const userEntities = getUserEntities();
  const entityOptions = userEntities.map((entity) => ({
    id: entity.entityId,
    name: entity.entityName,
    type: entity.entityType,
  }));

  const handleVehicleCreated = () => {
    // Trigger refresh of vehicle list
    setRefreshTrigger((prev) => prev + 1);
    // Optionally switch to browse section
    setActiveSection('browse');
  };

  return (
    <div>
      {/* Header */}
      <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
      <p className="text-muted-foreground mb-6">{t('description')}</p>

      {/* Section Navigation */}
      <div className="border-b border-border mb-6">
        <nav className="-mb-px flex gap-6">
            <button
                onClick={() => setActiveSection('browse')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
                    activeSection === 'browse'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
            >
                {t('sections.browse')}
            </button>
          <button
            onClick={() => setActiveSection('create')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
              activeSection === 'create'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            {t('sections.create')}
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="mt-6">
        {activeSection === 'create' && (
          <BulkVehicleForm
            entities={entityOptions}
            onSuccess={handleVehicleCreated}
          />
        )}
        {activeSection === 'browse' && (
          <VehiclesList
            entities={entityOptions}
            refreshTrigger={refreshTrigger}
          />
        )}
      </div>
    </div>
  );
}
