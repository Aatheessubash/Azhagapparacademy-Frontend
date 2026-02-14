const API_URL =
  import.meta.env.VITE_API_URL || 'https://azhagapparacademy-backend.onrender.com/api';

const getApiOrigin = () => {
  try {
    return new URL(API_URL).origin;
  } catch {
    return '';
  }
};

const API_ORIGIN = getApiOrigin();

export const resolveMediaUrl = (value?: string | null): string => {
  if (!value) return '';

  const trimmed = value.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return '';

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('//') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }

  const cleaned = trimmed.replace(/\\/g, '/');

  // Some backends accidentally persist `/api/uploads/...` while files are served from `/uploads/...`.
  const withoutApiPrefix = cleaned.startsWith('/api/uploads/') ? cleaned.slice('/api'.length) : cleaned;

  const normalized = withoutApiPrefix.startsWith('/') ? withoutApiPrefix : `/${withoutApiPrefix}`;
  return API_ORIGIN ? `${API_ORIGIN}${normalized}` : normalized;
};
