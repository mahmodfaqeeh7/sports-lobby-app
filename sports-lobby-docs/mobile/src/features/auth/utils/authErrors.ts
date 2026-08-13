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

function formatApiError(error: ApiClientError): string {
  const message = error.body?.error.message ?? error.message;
  const details = error.body?.error.details;
  if (!details || Object.keys(details).length === 0) {
    return message;
  }
  const detailText = Object.entries(details)
    .map(([field, value]) => `${field}: ${String(value)}`)
    .join('\n');
  return `${message}\n${detailText}`;
}
