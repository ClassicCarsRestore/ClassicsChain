import { findBrand, getBrandLogoUrl } from '@shared/brands';

interface BrandLogoProps {
  make: string;
  size?: 'sm' | 'md';
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
};

export function BrandLogo({ make, size = 'sm' }: BrandLogoProps) {
  const brand = findBrand(make);
  if (!brand?.logoFile) return null;

  const url = getBrandLogoUrl(brand.logoFile);
  if (!url) return null;

  return (
    <div className="inline-flex items-center justify-center rounded-md bg-white/80 p-1 backdrop-blur-sm">
      <img src={url} alt={brand.name} className={`${sizeClasses[size]} object-contain`} />
    </div>
  );
}
