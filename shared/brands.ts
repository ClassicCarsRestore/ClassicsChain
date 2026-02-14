import brandsJson from "./brands-slim.json";
import manifest from "./logo-manifest.json";

export interface Brand {
  name: string;
  country: string;
  logoFile: string | null;
}

interface RawBrand {
  b: string;
  c: string;
}

const manifestRecord = manifest as Record<string, string>;

export const brands: Brand[] = (brandsJson as RawBrand[]).map((r) => ({
  name: r.b,
  country: r.c,
  logoFile: manifestRecord[r.b] ?? null,
}));

const brandLookup = new Map<string, Brand>();
for (const brand of brands) {
  brandLookup.set(brand.name.toLowerCase(), brand);
}

export function findBrand(make: string): Brand | undefined {
  return brandLookup.get(make.toLowerCase());
}

export function getBrandLogoUrl(logoFile: string): string {
  // logoFile is like "logos/ferrari.svg" — served from public/brand-logos/
  const filename = logoFile.replace("logos/", "");
  return `/brand-logos/${filename}`;
}
