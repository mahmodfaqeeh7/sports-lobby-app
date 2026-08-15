import {publicMobileConfig} from './environment';

// OAuth client IDs are public identifiers, not secrets. Configure them in the
// selected mobile environment file when the Google projects are ready.
export const googleAuthConfig = {
  webClientId: publicMobileConfig.googleWebClientId,
  iosClientId: publicMobileConfig.googleIosClientId,
} as const;

export function isGoogleAuthConfigured(): boolean {
  return googleAuthConfig.webClientId.endsWith('.apps.googleusercontent.com');
}
