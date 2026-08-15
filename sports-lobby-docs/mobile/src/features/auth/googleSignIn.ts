import {Platform} from 'react-native';
import {googleAuthConfig, isGoogleAuthConfigured} from '../../config/googleAuth';

let configured = false;

export async function getGoogleIdToken(): Promise<string | undefined> {
  if (!isGoogleAuthConfigured()) {
    throw new Error(
      'Google sign-in needs the Web OAuth client ID in src/config/googleAuth.ts and the matching Android/iOS OAuth application configuration.',
    );
  }
  const {GoogleSignin} = await import('@react-native-google-signin/google-signin');
  if (!configured) {
    GoogleSignin.configure({
      webClientId: googleAuthConfig.webClientId,
      ...(googleAuthConfig.iosClientId
        ? {iosClientId: googleAuthConfig.iosClientId}
        : {}),
    });
    configured = true;
  }
  if (Platform.OS === 'android') {
    await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog: true});
  }
  const result = await GoogleSignin.signIn();
  if (result.type === 'cancelled') {
    return undefined;
  }
  if (!result.data.idToken) {
    throw new Error('Google did not return an ID token. Check the Web OAuth client ID.');
  }
  return result.data.idToken;
}
