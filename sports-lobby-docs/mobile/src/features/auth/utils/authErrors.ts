import { ApiClientError } from '../../../services/api/apiClient';

export type NoticeState = {
  title?: string;
  message?: string;
  tone?: 'info' | 'success' | 'error' | 'warning';
};

export function showError(
  error: unknown,
  setNotice: (notice: NoticeState) => void,
): void {
  if (error instanceof ApiClientError) {
    setNotice({
      title: 'Request failed',
      message: formatApiError(error),
      tone: 'error',
    });
    return;
  }
  setNotice({
    title: 'Request failed',
    message: error instanceof Error ? error.message : 'Unexpected error',
    tone: 'error',
  });
}

export function formatApiError(error: ApiClientError): string {
  const message = error.body?.error.message ?? error.message;
  const details = error.body?.error.details;
  if (!details || Object.keys(details).length === 0) {
    return message;
  }
  const detailText = formatDetails(details).join('\n');
  if (!detailText) {
    return message;
  }
  return `${message}\n${detailText}`;
}

function formatDetails(value: unknown, parentKey?: string): string[] {
  if (Array.isArray(value)) {
    return value.flatMap(item => formatDetails(item, parentKey));
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, nestedValue]) =>
      formatDetails(nestedValue, isDetailContainer(key) ? parentKey : key),
    );
  }

  if (value === undefined || value === null || value === '') {
    return [];
  }

  const detail = String(value);
  return parentKey ? [`${humanizeFieldName(parentKey)}: ${detail}`] : [detail];
}

function isDetailContainer(key: string): boolean {
  return key === 'fields' || key === 'violations';
}

function humanizeFieldName(value: string): string {
  const field = value.includes('.') ? (value.split('.').pop() ?? value) : value;
  const words = field
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase();
  return words ? `${words.charAt(0).toUpperCase()}${words.slice(1)}` : value;
}
