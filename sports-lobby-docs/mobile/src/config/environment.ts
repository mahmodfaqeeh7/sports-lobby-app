import Config from 'react-native-config';
import {Platform} from 'react-native';

export function apiBaseUrl(): string {
  const configured = Config.API_BASE_URL?.trim().replace(/\/+$/, '');
  if (configured) {
    if (!__DEV__ && !configured.startsWith('https://')) {
      throw new Error('Production API_BASE_URL must use HTTPS.');
    }
    return configured;
  }
  if (!__DEV__) {
    throw new Error('API_BASE_URL must be configured for production builds.');
  }
  return Platform.OS === 'android'
    ? 'http://10.0.2.2:8080/api/v1'
    : 'http://localhost:8080/api/v1';
}

export const publicMobileConfig = {
  googleWebClientId: Config.GOOGLE_WEB_CLIENT_ID?.trim() || '',
  googleIosClientId: Config.GOOGLE_IOS_CLIENT_ID?.trim() || '',
} as const;
