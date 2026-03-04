import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter, ChevronDown, Eye, Award, Car, Link2, FileCheck, Users, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { useVehicles } from '../hooks/useVehicles';
import { VehicleDetailModal } from './VehicleDetailModal';
import { getAlgorandAssetUrl } from '@/lib/utils';
import { BrandLogo } from '@/components/vehicle/BrandLogo';
import type { Vehicle } from '../types';

const PAGE_SIZE = 10;

type SortColumn = 'vehicle' | 'chassisNumber' | 'licensePlate' | 'events' | 'certifications' | 'status';
type SortDirection = 'asc' | 'desc';

interface Entity {
  id: string;
  name: string;
  type: string;
}

interface VehiclesListProps {
  entities: Entity[];
  refreshTrigger: number;
  onNavigateToCreate?: () => void;
}

type DetailTab = 'details' | 'certifications';

export function VehiclesList({ entities, refreshTrigger, onNavigateToCreate }: VehiclesListProps) {
  const { t } = useTranslation('vehicles');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unclaimed' | 'owned'>(
    'all'
  );
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [initialTab, setInitialTab] = useState<DetailTab>('details');
  const [filterOpen, setFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const filterRef = useRef<HTMLDivElement>(null);

  const handleSort = useCallback((column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  }, [sortColumn]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data, isLoading } = useVehicles(currentPage, PAGE_SIZE, refreshTrigger);
  const meta = data?.meta;

  const filteredVehicles = useMemo(() => {
    let result = data?.data ?? [];

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
    if (filterType === 'unclaimed') {
      result = result.filter((v) => !v.ownerId);
    } else if (filterType === 'owned') {
      result = result.filter((v) => v.ownerId);
    }

    // Sort
    if (sortColumn) {
      const multiplier = sortDirection === 'asc' ? 1 : -1;
      result = [...result].sort((a, b) => {
        switch (sortColumn) {
          case 'vehicle': {
            const aVal = `${a.make ?? ''} ${a.model ?? ''}`.toLowerCase();
            const bVal = `${b.make ?? ''} ${b.model ?? ''}`.toLowerCase();
            return aVal.localeCompare(bVal) * multiplier;
          }
          case 'chassisNumber': {
            const aVal = a.chassisNumber ?? '';
            const bVal = b.chassisNumber ?? '';
            return aVal.localeCompare(bVal) * multiplier;
          }
          case 'licensePlate': {
            const aVal = a.licensePlate ?? '';
            const bVal = b.licensePlate ?? '';
            return aVal.localeCompare(bVal) * multiplier;
          }
          case 'events': {
            const aVal = (a.certifiedEventsCount ?? 0) + (a.ownerEventsCount ?? 0);
            const bVal = (b.certifiedEventsCount ?? 0) + (b.ownerEventsCount ?? 0);
            return (aVal - bVal) * multiplier;
          }
          case 'certifications': {
            const aVal = a.activeCertificationsCount ?? 0;
            const bVal = b.activeCertificationsCount ?? 0;
            return (aVal - bVal) * multiplier;
          }
          case 'status': {
            const aVal = a.ownerId ? 1 : 0;
            const bVal = b.ownerId ? 1 : 0;
            return (aVal - bVal) * multiplier;
          }
          default:
            return 0;
        }
      });
    }

    return result;
  }, [data?.data, searchQuery, filterType, sortColumn, sortDirection]);

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
          <div className="relative h-10" ref={filterRef}>
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center gap-2 px-3 py-2 h-full border border-border rounded-md bg-white text-foreground hover:bg-muted cursor-pointer"
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm">{t('browse.filters.label')}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
            </button>
            {filterOpen && (
              <div className="absolute right-0 mt-1 w-48 bg-white border border-border rounded-md shadow-lg z-10">
                <button
                  onClick={() => { setFilterType('all'); setFilterOpen(false); }}
                  className={`block w-full text-left px-4 py-2 text-sm hover:bg-muted cursor-pointer ${
                    filterType === 'all' ? 'bg-muted text-primary' : 'text-foreground'
                  }`}
                >
                  {t('browse.filters.all')}
                </button>
                <button
                  onClick={() => { setFilterType('unclaimed'); setFilterOpen(false); }}
                  className={`block w-full text-left px-4 py-2 text-sm hover:bg-muted cursor-pointer ${
                    filterType === 'unclaimed'
                      ? 'bg-muted text-primary'
                      : 'text-foreground'
                  }`}
                >
                  {t('browse.filters.unclaimed')}
                </button>
                <button
                  onClick={() => { setFilterType('owned'); setFilterOpen(false); }}
                  className={`block w-full text-left px-4 py-2 text-sm hover:bg-muted cursor-pointer ${
                    filterType === 'owned' ? 'bg-muted text-primary' : 'text-foreground'
                  }`}
                >
                  {t('browse.filters.owned')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-muted-foreground">
        {meta ? t('browse.paginatedResults', {
          from: (meta.page - 1) * meta.limit + 1,
          to: Math.min(meta.page * meta.limit, meta.total),
          total: meta.total
        }) : t('browse.resultsCount', { count: filteredVehicles.length })}
      </div>

      {/* Vehicles Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  onClick={() => handleSort('vehicle')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                >
                  <div className="flex items-center gap-1">
                    {t('browse.columns.vehicle')}
                    {sortColumn === 'vehicle' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-gray-300" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('chassisNumber')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                >
                  <div className="flex items-center gap-1">
                    {t('browse.columns.chassisNumber')}
                    {sortColumn === 'chassisNumber' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-gray-300" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('licensePlate')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                >
                  <div className="flex items-center gap-1">
                    {t('browse.columns.licensePlate')}
                    {sortColumn === 'licensePlate' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-gray-300" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('browse.columns.blockchainAssetId')}
                </th>
                <th
                  onClick={() => handleSort('events')}
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                >
                  <div className="flex items-center justify-center gap-1">
                    {t('browse.columns.events')}
                    {sortColumn === 'events' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-gray-300" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('certifications')}
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                >
                  <div className="flex items-center justify-center gap-1">
                    {t('browse.columns.certifications')}
                    {sortColumn === 'certifications' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-gray-300" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('status')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                >
                  <div className="flex items-center gap-1">
                    {t('browse.columns.status')}
                    {sortColumn === 'status' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-gray-300" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('browse.columns.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    {t('browse.loading')}
                  </td>
                </tr>
              ) : filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Car className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-3">{t('browse.noVehicles')}</p>
                    {onNavigateToCreate && (
                      <button
                        onClick={onNavigateToCreate}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 hover:bg-primary/5 rounded-md transition-colors cursor-pointer"
                      >
                        {t('browse.addFirstVehicle')}
                        <span aria-hidden="true">→</span>
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <BrandLogo make={vehicle.make} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {vehicle.make} {vehicle.model}
                          </p>
                          <p className="text-xs text-gray-500">
                            {vehicle.year}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-xs bg-gray-100 text-gray-900 px-2 py-1 rounded">
                        {vehicle.chassisNumber || '-'}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vehicle.licensePlate || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {vehicle.blockchainAssetId ? (
                        <a
                          href={getAlgorandAssetUrl(vehicle.blockchainAssetId)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                        >
                          <Link2 className="h-3 w-3 text-green-600" />
                          <code className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded font-mono">
                            {vehicle.blockchainAssetId.length > 12
                              ? `${vehicle.blockchainAssetId.slice(0, 12)}...`
                              : vehicle.blockchainAssetId}
                          </code>
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-3 text-xs">
                        <span className="flex items-center gap-1" title={t('browse.tooltips.certifiedEvents')}>
                          <FileCheck className="h-3.5 w-3.5 text-blue-600" />
                          <span className="text-gray-700">{vehicle.certifiedEventsCount ?? 0}</span>
                        </span>
                        <span className="flex items-center gap-1" title={t('browse.tooltips.ownerEvents')}>
                          <Users className="h-3.5 w-3.5 text-gray-500" />
                          <span className="text-gray-700">{vehicle.ownerEventsCount ?? 0}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {(vehicle.activeCertificationsCount ?? 0) > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          <Award className="h-3 w-3" />
                          {vehicle.activeCertificationsCount}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">0</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {vehicle.ownerId ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {t('browse.status.owned')}
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          {t('browse.status.unclaimed')}
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

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            {t('browse.pagination.page', { current: meta.page, total: meta.totalPages })}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-border bg-white text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={currentPage === meta.totalPages}
              className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-border bg-white text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

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
