import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import KeyRound from 'lucide-react-native/icons/key-round';
import {
  AppButton,
  FormBuilder,
  FormBuilderField,
  FormSection,
} from '../../../components';
import { apiClient } from '../../../services/api/apiClient';
import { AuthenticatedSession } from '../../../services/session/sessionTypes';
import { colors, spacing, typography } from '../../../theme/tokens';
import { AuthLinks } from '../components/AuthLinks';
import { AuthPromptLink } from '../components/AuthPromptLink';
import { authApi, toSession } from '../api';
import { AuthView, PhoneVerificationContext } from '../types';
import { NoticeState, showError } from '../utils/authErrors';
import { requiredMessage } from '../utils/validation';

type PhoneVerificationFormValues = {
  otpCode: string;
};

const OTP_RULES = {
  required: requiredMessage('Verification code'),
  pattern: {
    value: /^\d{6}$/,
    message: 'Enter the 6-digit verification code.',
  },
} as const;

const OTP_FIELDS: FormBuilderField<PhoneVerificationFormValues>[] = [
  {
    type: 'text',
    name: 'otpCode',
    label: 'Verification code',
    keyboardType: 'number-pad',
    maxLength: 6,
    rules: OTP_RULES,
  },
];

const AUTH_OTP_FIELDS: FormBuilderField<PhoneVerificationFormValues>[] = [
  {
    type: 'text',
    name: 'otpCode',
    label: 'Verification code',
    keyboardType: 'number-pad',
    maxLength: 6,
    placeholder: '6-digit verification code',
    hideLabel: true,
    leadingIcon: <KeyRound color={colors.icon} size={21} strokeWidth={1.8} />,
    rules: OTP_RULES,
  },
];

type PhoneVerificationScreenProps = {
  context: PhoneVerificationContext;
  onAuthenticated: (session: AuthenticatedSession) => void;
  onNavigate: (view: AuthView) => void;
  setNotice: (notice: NoticeState) => void;
  appearance?: 'default' | 'auth';
  onStartOver?: () => void;
};

export function PhoneVerificationScreen({
  context,
  onAuthenticated,
  onNavigate,
  setNotice,
  appearance = 'default',
  onStartOver,
}: PhoneVerificationScreenProps): React.JSX.Element {
  const [busy, setBusy] = useState(false);

  const requestOtp = async () => {
    setBusy(true);
    setNotice({});
    try {
      await authApi.requestOtp(apiClient, context.phoneE164);
      setNotice({
        title: 'Code sent',
        message: 'Enter the 6-digit code to finish verification.',
        tone: 'success',
      });
    } catch (error) {
      showError(error, setNotice);
    } finally {
      setBusy(false);
    }
  };

  const verifyAndLogin = async ({ otpCode }: PhoneVerificationFormValues) => {
    setBusy(true);
    setNotice({});
    try {
      await authApi.verifyOtp(apiClient, context.phoneE164, otpCode);
      const response = await authApi.login(apiClient, {
        phoneE164: context.phoneE164,
        password: context.password,
        deviceLabel: 'Sports Lobby mobile',
      });
      onAuthenticated(toSession(response));
    } catch (error) {
      showError(error, setNotice);
    } finally {
      setBusy(false);
    }
  };

  const content = (
    <>
      {appearance === 'auth' ? (
        <View style={styles.heading}>
          <Text style={styles.title}>Verify your phone</Text>
          <Text style={styles.subtitle}>
            Enter the code sent to complete your account.
          </Text>
        </View>
      ) : null}
      <View style={styles.phoneBox}>
        <Text style={styles.phoneLabel}>Phone number</Text>
        <Text style={styles.phoneValue}>{context.phoneE164}</Text>
      </View>
      <FormBuilder
        fields={appearance === 'auth' ? AUTH_OTP_FIELDS : OTP_FIELDS}
        defaultValues={{ otpCode: '' }}
        onSubmit={verifyAndLogin}
        submitLabel="Continue"
        busy={busy}
        appearance={appearance}
        submitVariant={appearance === 'auth' ? 'brand' : 'primary'}
        submitSize={appearance === 'auth' ? 'large' : 'default'}
        secondaryAction={
          <AppButton
            label="Resend code"
            onPress={requestOtp}
            disabled={busy}
            variant="secondary"
            size={appearance === 'auth' ? 'large' : 'default'}
            style={styles.actionButton}
          />
        }
        footer={
          appearance === 'auth' ? (
            <AuthPromptLink
              prompt="Already have access? "
              action="Log in"
              onPress={onStartOver ?? (() => onNavigate('login'))}
            />
          ) : (
            <AuthLinks
              items={[
                {
                  text: 'Use another account',
                  onPress: () => onNavigate('login'),
                },
              ]}
            />
          )
        }
      />
    </>
  );

  if (appearance === 'auth') {
    return <View style={styles.authScreen}>{content}</View>;
  }

  return (
    <FormSection
      title="Confirm Your Phone"
      subtitle="This step is required before you can use Sports Lobby."
    >
      {content}
    </FormSection>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    flex: 1,
  },
  authScreen: {
    gap: spacing.xl,
  },
  heading: {
    gap: spacing.sm,
  },
  title: {
    color: colors.ink,
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 39,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24,
  },
  phoneBox: {
    backgroundColor: colors.background,
    borderRadius: 8,
    gap: spacing.xs,
    padding: spacing.md,
  },
  phoneLabel: {
    ...typography.caption,
    color: colors.muted,
  },
  phoneValue: {
    ...typography.button,
    color: colors.text,
  },
});
