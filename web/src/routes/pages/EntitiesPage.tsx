import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, MapPin, ExternalLink, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import type { PublicEntity, PublicEntityListResponse } from "@/types/entity.ts";

type EntityTypeFilter = 'all' | 'certifier' | 'partner';

export function EntitiesPage() {
  const { t } = useTranslation('entities');
  const [entities, setEntities] = useState<PublicEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Filters
  const [typeFilter, setTypeFilter] = useState<EntityTypeFilter>('all');
  const [nameFilter, setNameFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');

  useEffect(() => {
    const loadEntities = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await api.get<PublicEntityListResponse>(`/v1/public/entities?limit=100`);
        setEntities(response.data);
      } catch (err) {
        console.error('Failed to fetch entities:', err);
        setError('Failed to load entities');
      } finally {
        setIsLoading(false);
      }
    };

    loadEntities();
  }, []);

  // Client-side filtering
  const filteredEntities = useMemo(() => {
    return entities.filter((entity) => {
      // Type filter
      if (typeFilter !== 'all' && entity.type !== typeFilter) {
        return false;
      }

      // Name filter
      if (nameFilter && !entity.name.toLowerCase().includes(nameFilter.toLowerCase())) {
        return false;
      }

      // City filter
      if (cityFilter && !entity.address?.city.toLowerCase().includes(cityFilter.toLowerCase())) {
        return false;
      }

      // Country filter
      if (countryFilter && !entity.address?.country.toLowerCase().includes(countryFilter.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [entities, typeFilter, nameFilter, cityFilter, countryFilter]);

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          {t('title')}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {t('description')}
        </p>
      </div>

      {/* Filters */}
      <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen} className="mb-6">
        <div className="rounded-lg border border-border bg-card py-2 px-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              {t('filters.title', { defaultValue: 'Filters' })}
            </h2>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`cursor-pointer transition-transform ${isFiltersOpen ? 'rotate-180' : ''}`}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent className="mt-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Name Filter */}
              <div>
                <label htmlFor="name-filter" className="block text-sm font-medium text-foreground pl-2 mb-2">
                  {t('filters.name')}
                </label>
                <input
                  id="name-filter"
                  type="text"
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  placeholder={t('filters.namePlaceholder')}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Type Filter */}
              <div>
                <label htmlFor="type-filter" className="block text-sm font-medium text-foreground pl-2 mb-2">
                  {t('filters.type')}
                </label>
                <select
                  id="type-filter"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as EntityTypeFilter)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="all">{t('filters.typeOptions.all')}</option>
                  <option value="certifier">{t('filters.typeOptions.certifier')}</option>
                  <option value="partner">{t('filters.typeOptions.partner')}</option>
                </select>
              </div>

              {/* City Filter */}
              <div>
                <label htmlFor="city-filter" className="block text-sm font-medium text-foreground pl-2 mb-2">
                  {t('filters.city')}
                </label>
                <input
                  id="city-filter"
                  type="text"
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  placeholder={t('filters.cityPlaceholder')}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Country Filter */}
              <div>
                <label htmlFor="country-filter" className="block text-sm font-medium text-foreground pl-2 mb-2">
                  {t('filters.country')}
                </label>
                <input
                  id="country-filter"
                  type="text"
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                  placeholder={t('filters.countryPlaceholder')}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {/* Results count */}
            {!isLoading && (
              <p className="mt-4 text-sm text-muted-foreground">
                {t('resultsCount', { count: filteredEntities.length })}
              </p>
            )}
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Content */}
      <div className="rounded-lg border border-border bg-card p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">{t('loading')}</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-destructive">{error}</p>
          </div>
        ) : filteredEntities.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <Building2 className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-foreground">
              {t('empty.title')}
            </h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              {t('empty.description')}
            </p>
          </div>
        ) : (
          /* Entity Grid */
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEntities.map((entity) => (
              <div
                key={entity.id}
                className="rounded-lg border border-border bg-background p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h3 className="font-semibold text-foreground">
                      {entity.name}
                    </h3>
                    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      entity.type === 'certifier'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                    }`}>
                      {t(`entityTypes.${entity.type}`)}
                    </span>
                  </div>
                </div>

                {entity.description && (
                  <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                    {entity.description}
                  </p>
                )}

                {entity.address && entity.address?.city.length > 0 && entity.address?.country.length > 0 && (
                  <div className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      {entity.address.city}, {entity.address.country}
                    </span>
                  </div>
                )}

                {entity.website && (
                  <a
                    href={entity.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {t('visitWebsite')}
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
