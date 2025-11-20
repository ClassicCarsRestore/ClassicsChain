export const STORAGE_BASE_URL = import.meta.env.VITE_STORAGE_BASE_URL || 'http://localhost:9000';

export function generateStorageUrl(objectKey: string): string {
  return `${STORAGE_BASE_URL}/${objectKey}`;
}
