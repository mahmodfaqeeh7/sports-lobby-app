import {ApiErrorResponse} from './types';
import {apiBaseUrl} from '../../config/environment';

const REQUEST_TIMEOUT_MS = 8000;
const DEFAULT_API_BASE_URL = apiBaseUrl();

export class ApiClient {
  private unauthorizedHandler?: (failedAccessToken: string) => Promise<string | undefined>;

  constructor(private readonly baseUrl: string = DEFAULT_API_BASE_URL) {}

  setUnauthorizedHandler(
    handler?: (failedAccessToken: string) => Promise<string | undefined>,
  ): void {
    this.unauthorizedHandler = handler;
  }

  async get<T>(path: string, accessToken?: string): Promise<T> {
    return this.request<T>('GET', path, undefined, accessToken);
  }

  async post<T>(path: string, body?: unknown, accessToken?: string): Promise<T> {
    return this.request<T>('POST', path, body, accessToken);
  }

  async put<T>(path: string, body: unknown, accessToken?: string): Promise<T> {
    return this.request<T>('PUT', path, body, accessToken);
  }

  async patch<T>(path: string, body: unknown, accessToken?: string): Promise<T> {
    return this.request<T>('PATCH', path, body, accessToken);
  }

  async delete<T>(path: string, body?: unknown, accessToken?: string): Promise<T> {
    return this.request<T>('DELETE', path, body, accessToken);
  }

  private async request<T>(method: string, path: string, body?: unknown, accessToken?: string): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: this.headers(accessToken, body !== undefined),
        signal: controller.signal,
        ...(body !== undefined ? {body: JSON.stringify(body)} : {}),
      });

      if (response.status === 401 && accessToken && this.unauthorizedHandler) {
        const refreshedAccessToken = await this.unauthorizedHandler(accessToken);
        if (refreshedAccessToken) {
          const retriedResponse = await fetch(`${this.baseUrl}${path}`, {
            method,
            headers: this.headers(refreshedAccessToken, body !== undefined),
            signal: controller.signal,
            ...(body !== undefined ? {body: JSON.stringify(body)} : {}),
          });
          return this.parse<T>(retriedResponse);
        }
      }

      return this.parse<T>(response);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Backend request timed out. Check that the backend is running and reachable from the simulator.');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private headers(accessToken?: string, hasBody = false): Record<string, string> {
    return {
      Accept: 'application/json',
      ...(hasBody ? {'Content-Type': 'application/json'} : {}),
      ...(accessToken ? {Authorization: `Bearer ${accessToken}`} : {}),
    };
  }

  private async parse<T>(response: Response): Promise<T> {
    if (response.ok) {
      const text = await response.text();
      return (text ? JSON.parse(text) : undefined) as T;
    }

    const body = (await response.json().catch(() => undefined)) as ApiErrorResponse | undefined;
    throw new ApiClientError(response.status, body);
  }
}

export class ApiClientError extends Error {
  constructor(
    readonly status: number,
    readonly body?: ApiErrorResponse,
  ) {
    super(body?.error.message ?? `API request failed with status ${status}`);
  }
}

export const apiClient = new ApiClient();
