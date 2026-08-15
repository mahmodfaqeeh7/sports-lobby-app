import React, {useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {FormBuilder, FormBuilderField, PhoneFieldValue, toE164} from '../../../components';
import {apiClient} from '../../../services/api/apiClient';
import {AuthenticatedSession} from '../../../services/session/sessionTypes';
import {colors, spacing} from '../../../theme/tokens';
import {authApi, toSession} from '../api';
import {AuthBrand} from '../components/AuthBrand';
import {AuthPromptLink} from '../components/AuthPromptLink';
import {GoogleLogo} from '../components/GoogleLogo';
import {LegalConsentField} from '../components/LegalConsentField';
import {getGoogleIdToken} from '../googleSignIn';
import {AuthView, PhoneVerificationContext} from '../types';
import {NoticeState, showError} from '../utils/authErrors';
import {validatePhone} from '../utils/validation';
import {PhoneVerificationScreen} from './PhoneVerificationScreen';

type Values = {
  phone: PhoneFieldValue;
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
};

const fields: FormBuilderField<Values>[] = [
  {type: 'phone', name: 'phone', label: 'Mobile number', placeholder: 'Phone number', hideLabel: true, rules: {validate: validatePhone}},
  {
    type: 'custom', name: 'acceptedTerms', rules: {validate: value => value === true || 'Accept the Terms of Service to continue.'},
    render: ({field, fieldState}) => <LegalConsentField document="terms" accepted={field.value === true} onChange={field.onChange} onBlur={field.onBlur} errorText={fieldState.error?.message} />,
  },
  {
    type: 'custom', name: 'acceptedPrivacy', rules: {validate: value => value === true || 'Accept the Privacy Policy to continue.'},
    render: ({field, fieldState}) => <LegalConsentField document="privacy" accepted={field.value === true} onChange={field.onChange} onBlur={field.onBlur} errorText={fieldState.error?.message} />,
  },
];

type Props = {
  onAuthenticated: (session: AuthenticatedSession) => void;
  onNavigate: (view: AuthView) => void;
  setNotice: (notice: NoticeState) => void;
};

export function GoogleAuthScreen({onAuthenticated, onNavigate, setNotice}: Props): React.JSX.Element {
  const [busy, setBusy] = useState(false);
  const [verificationContext, setVerificationContext] = useState<PhoneVerificationContext>();

  const authenticate = async ({phone, acceptedTerms, acceptedPrivacy}: Values) => {
    setBusy(true);
    setNotice({});
    try {
      const idToken = await getGoogleIdToken();
      if (!idToken) {
        return;
      }
      const response = await authApi.google(apiClient, {
        idToken,
        phoneE164: toE164(phone.countryCode, phone.nationalNumber),
        acceptedTerms,
        acceptedPrivacy,
        deviceLabel: 'Sports Lobby mobile · Google',
      });
      const session = toSession(response);
      if (response.user.phoneVerified) {
        onAuthenticated(session);
        return;
      }
      setVerificationContext({
        phoneE164: response.user.phoneE164,
        title: 'Google account connected',
        otpAlreadySent: true,
        accessToken: response.tokens.accessToken,
        pendingSession: session,
      });
    } catch (error) {
      showError(error, setNotice);
    } finally {
      setBusy(false);
    }
  };

  if (verificationContext) {
    return (
      <View style={styles.screen}>
        <AuthBrand />
        <PhoneVerificationScreen context={verificationContext} onAuthenticated={onAuthenticated} onNavigate={onNavigate} setNotice={setNotice} appearance="auth" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <AuthBrand />
      <View style={styles.heading}>
        <GoogleLogo size={36} />
        <Text style={styles.title}>Continue with Google</Text>
        <Text style={styles.subtitle}>A mobile number is required for new accounts and remains subject to phone verification. Existing Google accounts keep their saved number.</Text>
      </View>
      <FormBuilder
        fields={fields}
        defaultValues={{phone: {countryCode: '+962', nationalNumber: ''}, acceptedTerms: false, acceptedPrivacy: false}}
        onSubmit={authenticate}
        submitLabel="Continue with Google"
        busy={busy}
        appearance="auth"
        submitVariant="brand"
        submitSize="large"
        footer={<AuthPromptLink prompt="Prefer phone and password? " action="Log in" onPress={() => onNavigate('login')} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {alignSelf: 'center', gap: spacing.xl, maxWidth: 500, width: '100%'},
  heading: {alignItems: 'center', gap: spacing.sm},
  title: {color: colors.ink, fontSize: 30, fontWeight: '800', lineHeight: 38, textAlign: 'center'},
  subtitle: {color: colors.muted, fontSize: 16, lineHeight: 24, textAlign: 'center'},
});
