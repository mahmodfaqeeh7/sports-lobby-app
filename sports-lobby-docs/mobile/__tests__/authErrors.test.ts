import { ApiClientError } from '../src/services/api/apiClient';
import { formatApiError } from '../src/features/auth/utils/authErrors';

describe('formatApiError', () => {
  it('formats nested field validation details without object coercion', () => {
    const error = new ApiClientError(400, {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed.',
        details: {
          fields: {
            contactPhone: 'must be a valid international phone number',
            addressLine: 'must not be blank',
          },
        },
      },
    });

    expect(formatApiError(error)).toBe(
      'Request validation failed.\n' +
        'Contact phone: must be a valid international phone number\n' +
        'Address line: must not be blank',
    );
    expect(formatApiError(error)).not.toContain('[object Object]');
  });

  it('formats nested constraint violations', () => {
    const error = new ApiClientError(400, {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed.',
        details: {
          violations: {
            'create.request.timezone': 'must not be blank',
          },
        },
      },
    });

    expect(formatApiError(error)).toBe(
      'Request validation failed.\nTimezone: must not be blank',
    );
  });
});
