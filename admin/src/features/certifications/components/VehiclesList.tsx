import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter, ChevronDown, Eye, Award } from 'lucide-react';
import { useVehicles } from '../hooks/useVehicles';
import { VehicleDetailModal } from './VehicleDetailModal';
import type { Vehicle } from '../types';

interface Entity {
  id: string;
  name: string;
  type: string;
}

interface VehiclesListProps {
  entities: Entity[];
  refreshTrigger: number;
}

type DetailTab = 'details' | 'certifications';

export function VehiclesList({ entities, refreshTrigger }: VehiclesListProps) {
  const { t } = useTranslation('vehicles');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'orphaned' | 'owned'>(
    'all'
  );
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [initialTab, setInitialTab] = useState<DetailTab>('details');

  const { data: vehicles = [], isLoading } = useVehicles(refreshTrigger);

  const filteredVehicles = useMemo(() => {
    let result = vehicles;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (v) =>
          (v.chassisNumber?.toLowerCase().includes(query) ?? false) ||
          (v.make?.toLowerCase().includes(query) ?? false) ||
          (v.model?.toLowerCase().includes(query) ?? false) ||
          (v.licensePlate?.toLowerCase().includes(query) ?? false)
      );
    }

    // Filter by ownership status
    if (filterType === 'orphaned') {
      result = result.filter((v) => !v.ownerId);
    } else if (filterType === 'owned') {
      result = result.filter((v) => v.ownerId);
    }

    return result;
  }, [vehicles, searchQuery, filterType]);

  const handleViewDetails = (vehicle: Vehicle, tab: DetailTab = 'details') => {
    setSelectedVehicle(vehicle);
    setInitialTab(tab);
    setShowDetailModal(true);
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('browse.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Filter Dropdown */}
          <div className="relative group h-10">
            <button className="flex items-center gap-2 px-3 py-2 h-full border border-border rounded-md bg-background text-foreground hover:bg-muted">
              <Filter className="w-4 h-4" />
              <span className="text-sm">{t('browse.filters.label')}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            <div className="absolute right-0 mt-1 w-48 bg-card border border-border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <button
                onClick={() => setFilterType('all')}
                className={`block w-full text-left px-4 py-2 text-sm hover:bg-muted ${
                  filterType === 'all' ? 'bg-muted text-primary' : 'text-foreground'
                }`}
              >
                {t('browse.filters.all')}
              </button>
              <button
                onClick={() => setFilterType('orphaned')}
                className={`block w-full text-left px-4 py-2 text-sm hover:bg-muted ${
                  filterType === 'orphaned'
                    ? 'bg-muted text-primary'
                    : 'text-foreground'
                }`}
              >
                {t('browse.filters.orphaned')}
              </button>
              <button
                onClick={() => setFilterType('owned')}
                className={`block w-full text-left px-4 py-2 text-sm hover:bg-muted ${
                  filterType === 'owned' ? 'bg-muted text-primary' : 'text-foreground'
                }`}
              >
                {t('browse.filters.owned')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-muted-foreground">
        {t('browse.resultsCount', { count: filteredVehicles.length })}
      </div>

      {/* Vehicles Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('browse.columns.vehicle')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('browse.columns.chassisNumber')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('browse.columns.licensePlate')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('browse.columns.status')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('browse.columns.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    {t('browse.loading')}
                  </td>
                </tr>
              ) : filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    {t('browse.noVehicles')}
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {vehicle.make} {vehicle.model}
                        </p>
                        <p className="text-xs text-gray-500">
                          {vehicle.year}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-xs bg-gray-100 text-gray-900 px-2 py-1 rounded">
                        {vehicle.chassisNumber || '-'}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vehicle.licensePlate || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {vehicle.ownerId ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {t('browse.status.owned')}
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          {t('browse.status.orphaned')}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex gap-3 justify-end">
                        <button
                          onClick={() => handleViewDetails(vehicle, 'details')}
                          className="text-blue-600 hover:text-blue-900 transition-colors cursor-pointer"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleViewDetails(vehicle, 'certifications')}
                          className="text-blue-600 hover:text-blue-900 transition-colors cursor-pointer"
                          title="Add certification"
                        >
                          <Award className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedVehicle && (
        <VehicleDetailModal
          vehicle={selectedVehicle}
          entities={entities}
          isOpen={showDetailModal}
          initialTab={initialTab}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedVehicle(null);
          }}
        />
      )}
    </div>
  );
}
