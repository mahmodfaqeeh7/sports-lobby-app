import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import LockKeyhole from 'lucide-react-native/icons/lock-keyhole';
import Store from 'lucide-react-native/icons/store';
import UserRound from 'lucide-react-native/icons/user-round';
import {
  FormBuilder,
  FormBuilderField,
  PhoneFieldValue,
  toE164,
} from '../../../components';
import { apiClient } from '../../../services/api/apiClient';
import { AuthenticatedSession } from '../../../services/session/sessionTypes';
import { colors, spacing } from '../../../theme/tokens';
import { AuthActionLinks } from '../components/AuthActionLinks';
import { AuthBrand } from '../components/AuthBrand';
import { AuthDivider } from '../components/AuthDivider';
import { GoogleLogo } from '../components/GoogleLogo';
import { SocialAuthButton } from '../components/SocialAuthButton';
import { authApi, toSession } from '../api';
import { AuthView, PhoneVerificationContext } from '../types';
import { NoticeState, showError } from '../utils/authErrors';
import { requiredMessage, validatePhone } from '../utils/validation';

type LoginFormValues = {
  phone: PhoneFieldValue;
  password: string;
};

const LOGIN_FIELDS: FormBuilderField<LoginFormValues>[] = [
  {
    type: 'phone',
    name: 'phone',
    label: 'Phone number',
    placeholder: 'Phone number',
    hideLabel: true,
    rules: { validate: validatePhone },
  },
  {
    type: 'password',
    name: 'password',
    label: 'Password',
    placeholder: 'Password',
    hideLabel: true,
    rules: { required: requiredMessage('Password') },
  },
];

type LoginScreenProps = {
  onAuthenticated: (session: AuthenticatedSession) => void;
  onNavigate: (view: AuthView) => void;
  onPhoneVerificationRequired: (
    context: PhoneVerificationContext,
  ) => Promise<void>;
  setNotice: (notice: NoticeState) => void;
};

export function LoginScreen({
  onAuthenticated,
  onNavigate,
  onPhoneVerificationRequired,
  setNotice,
}: LoginScreenProps): React.JSX.Element {
  const [busy, setBusy] = useState(false);

  const login = async ({ phone, password }: LoginFormValues) => {
    setBusy(true);
    setNotice({});
    try {
      const phoneE164 = toE164(phone.countryCode, phone.nationalNumber);
      const response = await authApi.login(apiClient, {
        phoneE164,
        password,
        deviceLabel: 'Sports Lobby mobile',
      });
      if (!response.user.phoneVerified) {
        await onPhoneVerificationRequired({
          phoneE164: response.user.phoneE164,
          password,
          title: 'Confirm your phone to continue',
          otpAlreadySent: false,
          accessToken: response.tokens.accessToken,
          pendingSession: toSession(response),
        });
        return;
      }
      onAuthenticated(toSession(response));
    } catch (error) {
      showError(error, setNotice);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.screen}>
      <AuthBrand />

      <View style={styles.welcome}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>
          Log in to reserve seats and join games.
        </Text>
      </View>

      <FormBuilder
        fields={LOGIN_FIELDS}
        defaultValues={{
          phone: { countryCode: '+962', nationalNumber: '' },
          password: '',
        }}
        onSubmit={login}
        submitLabel="Log In"
        busy={busy}
        appearance="auth"
        submitVariant="brand"
        submitSize="large"
        footer={
          <View style={styles.footer}>
            <AuthDivider label="or continue with" />
            <SocialAuthButton
              label="Sign in with Google"
              icon={<GoogleLogo size={25} />}
              onPress={() => onNavigate('googleAuth')}
            />
            <AuthActionLinks
              items={[
                {
                  key: 'forgot-password',
                  icon: (
                    <LockKeyhole
                      color={colors.brand}
                      size={22}
                      strokeWidth={1.8}
                    />
                  ),
                  action: 'Forgot password?',
                  onPress: () => onNavigate('forgotPassword'),
                },
                {
                  key: 'player-signup',
                  icon: (
                    <UserRound
                      color={colors.brand}
                      size={23}
                      strokeWidth={1.8}
                    />
                  ),
                  lead: "Don't have account? ",
                  action: 'Sign up',
                  onPress: () => onNavigate('playerSignup'),
                },
                {
                  key: 'vendor-signup',
                  icon: (
                    <Store color={colors.brand} size={22} strokeWidth={1.8} />
                  ),
                  lead: 'Are you a vendor? ',
                  action: 'Sign up as a Vendor',
                  onPress: () => onNavigate('vendorSignup'),
                },
              ]}
            />
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignSelf: 'center',
    gap: spacing.lg,
    maxWidth: 500,
    width: '100%',
  },
  welcome: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    color: colors.ink,
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 41,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  footer: {
    gap: spacing.md,
    paddingTop: spacing.xs,
  },
});
