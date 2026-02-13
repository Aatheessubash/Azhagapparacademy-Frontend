const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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

  if (
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('//') ||
    value.startsWith('blob:') ||
    value.startsWith('data:')
  ) {
    return value;
  }

  const normalized = value.startsWith('/') ? value : `/${value}`;
  return API_ORIGIN ? `${API_ORIGIN}${normalized}` : normalized;
};

