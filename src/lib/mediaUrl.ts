import { resolveUploadedMediaUrl } from '@shared/mediaUrl';

/** Resolve uploaded media against the same API base used by API requests. */
export function resolveMediaUrl(value: string): string {
  return resolveUploadedMediaUrl(value, import.meta.env.VITE_API_BASE_URL || '');
}
