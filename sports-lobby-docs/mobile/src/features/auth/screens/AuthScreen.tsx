import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { AppScreen } from '../../../components';
import { apiClient } from '../../../services/api/apiClient';
import { AuthenticatedSession } from '../../../services/session/sessionTypes';
import { VendorSignupScreen } from '../../vendor-onboarding';
import { AuthNotice } from '../components/AuthNotice';
import { authApi } from '../api';
import { AuthView, PhoneVerificationContext } from '../types';
import { colors, spacing } from '../../../theme/tokens';
import { NoticeState } from '../utils/authErrors';
import { ForgotPasswordScreen } from './ForgotPasswordScreen';
import { LoginScreen } from './LoginScreen';
import { PhoneVerificationScreen } from './PhoneVerificationScreen';
import { PlayerSignupScreen } from './PlayerSignupScreen';

type AuthScreenProps = {
  onAuthenticated: (session: AuthenticatedSession) => void;
};

const EMPTY_VERIFICATION_CONTEXT: PhoneVerificationContext = {
  phoneE164: '',
  password: '',
  title: '',
  otpAlreadySent: false,
};

export function AuthScreen({
  onAuthenticated,
}: AuthScreenProps): React.JSX.Element {
  const [view, setView] = useState<AuthView>('login');
  const [notice, setNotice] = useState<NoticeState>({});
  const [verificationContext, setVerificationContext] =
    useState<PhoneVerificationContext>(EMPTY_VERIFICATION_CONTEXT);

  const beginPhoneConfirmation = async (context: PhoneVerificationContext) => {
    setVerificationContext(context);
    setView('confirmPhone');
    if (!context.otpAlreadySent) {
      await authApi.requestOtp(apiClient, context.phoneE164);
    }
    setNotice({
      title: context.title,
      message:
        'We sent a verification code to your phone. Enter it to continue.',
      tone: 'success',
    });
  };

  const navigate = (nextView: AuthView) => {
    setNotice({});
    setView(nextView);
  };

  const customAuthLayout =
    view === 'login' || view === 'playerSignup' || view === 'forgotPassword';

  return (
    <AppScreen
      title={customAuthLayout ? undefined : screenTitle(view)}
      subtitle={customAuthLayout ? undefined : screenSubtitle(view)}
      contentStyle={customAuthLayout ? styles.authContent : undefined}
    >
      <AuthNotice notice={notice} onDismiss={() => setNotice({})} />
      {view === 'login' ? (
        <LoginScreen
          onAuthenticated={onAuthenticated}
          onNavigate={navigate}
          onPhoneVerificationRequired={beginPhoneConfirmation}
          setNotice={setNotice}
        />
      ) : null}
      {view === 'playerSignup' ? (
        <PlayerSignupScreen
          onAuthenticated={onAuthenticated}
          onNavigate={navigate}
          setNotice={setNotice}
        />
      ) : null}
      {view === 'vendorSignup' ? (
        <VendorSignupScreen
          onNavigate={navigate}
          onPhoneVerificationRequired={beginPhoneConfirmation}
          setNotice={setNotice}
        />
      ) : null}
      {view === 'confirmPhone' ? (
        <PhoneVerificationScreen
          context={verificationContext}
          onAuthenticated={onAuthenticated}
          onNavigate={navigate}
          setNotice={setNotice}
        />
      ) : null}
      {view === 'forgotPassword' ? (
        <ForgotPasswordScreen onNavigate={navigate} setNotice={setNotice} />
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  authContent: {
    backgroundColor: colors.surface,
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
  },
});

function screenTitle(view: AuthView): string {
  switch (view) {
    case 'playerSignup':
      return 'Create Account';
    case 'vendorSignup':
      return 'Vendor Sign Up';
    case 'confirmPhone':
      return 'Confirm Phone';
    case 'forgotPassword':
      return 'Password Help';
    case 'login':
    default:
      return 'Sports Lobby';
  }
}

function screenSubtitle(view: AuthView): string {
  switch (view) {
    case 'playerSignup':
      return 'Join games around you in a few steps.';
    case 'vendorSignup':
      return 'Apply to manage venues, courts, and lobbies.';
    case 'confirmPhone':
      return 'Enter the code we sent to your phone.';
    case 'forgotPassword':
      return 'Recover access to your account.';
    case 'login':
    default:
      return 'Book sports lobbies and manage your games.';
  }
}
