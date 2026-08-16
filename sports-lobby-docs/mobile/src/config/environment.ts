import Config from 'react-native-config';
import {Platform} from 'react-native';

export type MobileEnvironment = 'local' | 'production';

export const mobileEnvironment = resolveMobileEnvironment();

export function apiBaseUrl(): string {
  const configured = Config.API_BASE_URL?.trim().replace(/\/+$/, '');
  if (configured) {
    if (mobileEnvironment === 'production' && !configured.startsWith('https://')) {
      throw new Error('Production API_BASE_URL must use HTTPS.');
    }
    return configured;
  }
  if (mobileEnvironment === 'production') {
    throw new Error('API_BASE_URL must be configured for production builds.');
  }
  return Platform.OS === 'android'
    ? 'http://10.0.2.2:8080/api/v1'
    : 'http://localhost:8080/api/v1';
}

export function reachableBackendUrl(url: string): string {
  if (Platform.OS !== 'android') {
    return url;
  }
  return url.replace(/^(https?:\/\/)localhost(?=[:/])/, '$110.0.2.2');
}

export const publicMobileConfig = {
  environment: mobileEnvironment,
  googleWebClientId: Config.GOOGLE_WEB_CLIENT_ID?.trim() || '',
  googleIosClientId: Config.GOOGLE_IOS_CLIENT_ID?.trim() || '',
} as const;

function resolveMobileEnvironment(): MobileEnvironment {
  const configured = Config.APP_ENV?.trim().toLowerCase();
  const environment = configured || (__DEV__ ? 'local' : 'production');
  if (environment !== 'local' && environment !== 'production') {
    throw new Error(`Unsupported APP_ENV: ${environment}.`);
  }
  if (!__DEV__ && environment !== 'production') {
    throw new Error('Release builds must use APP_ENV=production.');
  }
  return environment;
}
