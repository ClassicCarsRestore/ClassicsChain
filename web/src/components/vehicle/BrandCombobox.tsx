import { useState, useRef } from 'react';
import { ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { brands, findBrand, getBrandLogoUrl } from '@shared/brands';
import type { Brand } from '@shared/brands';

interface BrandComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  hasError?: boolean;
}

export function BrandCombobox({ value, onValueChange, placeholder = 'Select brand...', hasError }: BrandComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selectedBrand = value ? findBrand(value) : undefined;
  const searchRef = useRef('');
  searchRef.current = search;

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen && searchRef.current && !findBrand(searchRef.current)) {
      onValueChange(searchRef.current);
    }
    setOpen(isOpen);
  }

  function renderBrandLogo(brand: Brand) {
    if (!brand.logoFile) return null;
    const url = getBrandLogoUrl(brand.logoFile);
    return <img src={url} alt="" className="h-5 w-5 object-contain" />;
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'mt-1 flex w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-left text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
            hasError ? 'border-red-500' : 'border-border',
            !value && 'text-muted-foreground'
          )}
        >
          <span className="flex items-center gap-2 truncate">
            {selectedBrand && renderBrandLogo(selectedBrand)}
            {value || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={true}>
          <CommandInput
            placeholder="Search brands..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty className="px-2 py-3 text-sm text-muted-foreground">
              {search ? `Use "${search}" as custom brand` : 'Type to search...'}
            </CommandEmpty>
            <CommandGroup>
              {brands.map((brand) => (
                <CommandItem
                  key={brand.name}
                  value={brand.name}
                  onSelect={(val) => {
                    onValueChange(val === value ? '' : val);
                    setSearch('');
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center gap-2">
                    {renderBrandLogo(brand)}
                    <span>{brand.name}</span>
                    {brand.country && (
                      <span className="text-xs text-muted-foreground">({brand.country})</span>
                    )}
                  </div>
                  <Check className={cn('ml-auto h-4 w-4', value === brand.name ? 'opacity-100' : 'opacity-0')} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
      <input type="hidden" name="make" value={value} />
    </Popover>
  );
}
