import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Clock3 from 'lucide-react-native/icons/clock-3';
import Phone from 'lucide-react-native/icons/phone';
import ShieldCheck from 'lucide-react-native/icons/shield-check';
import {
  AppButton,
  FormBuilder,
  FormBuilderField,
  FormSection,
  InfoBanner,
  OtpCodeInput,
  PhoneNumberField,
  PhoneFieldValue,
  callingCodes,
  toE164,
} from '../../../components';
import { apiClient } from '../../../services/api/apiClient';
import { AuthenticatedSession } from '../../../services/session/sessionTypes';
import { colors, spacing, typography } from '../../../theme/tokens';
import { AuthLinks } from '../components/AuthLinks';
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

const FALLBACK_RESEND_COOLDOWN_MS = 60_000;

type PhoneVerificationScreenProps = {
  context: PhoneVerificationContext;
  onAuthenticated: (session: AuthenticatedSession) => void;
  onNavigate: (view: AuthView) => void;
  setNotice: (notice: NoticeState) => void;
  appearance?: 'default' | 'auth';
  onStartOver?: () => void;
  subtitle?: string;
  phoneLabel?: string;
  securityMessage?: string;
};

export function PhoneVerificationScreen({
  context,
  onAuthenticated,
  onNavigate,
  setNotice,
  appearance = 'default',
  subtitle = 'We sent a verification code to your phone number.',
  phoneLabel,
  securityMessage = 'Phone verification helps secure your account.',
}: PhoneVerificationScreenProps): React.JSX.Element {
  const [busy, setBusy] = useState(false);
  const [currentPhone, setCurrentPhone] = useState(context.phoneE164);
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneDraft, setPhoneDraft] = useState<PhoneFieldValue>(() => phoneParts(context.phoneE164));
  const [otpCode, setOtpCode] = useState('');
  const [resendAvailableAt, setResendAvailableAt] = useState<string | undefined>(
    () => initialResendAvailableAt(context),
  );
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setOtpCode('');
    setCurrentPhone(context.phoneE164);
    setPhoneDraft(phoneParts(context.phoneE164));
    setEditingPhone(false);
    setResendAvailableAt(initialResendAvailableAt(context));
    setNow(Date.now());
  }, [context]);

  useEffect(() => {
    if (secondsUntil(resendAvailableAt, Date.now()) <= 0) {
      return;
    }

    const timer = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(timer);
  }, [resendAvailableAt]);

  const remainingSeconds = secondsUntil(resendAvailableAt, now);
  const authOtpFields = useMemo<
    FormBuilderField<PhoneVerificationFormValues>[]
  >(
    () => [
      {
        type: 'custom',
        name: 'otpCode',
        rules: OTP_RULES,
        render: ({ field, fieldState }) => (
          <OtpCodeInput
            value={typeof field.value === 'string' ? field.value : ''}
            onChangeText={value => {
              setOtpCode(value);
              field.onChange(value);
            }}
            onBlur={field.onBlur}
            errorText={fieldState.error?.message}
          />
        ),
      },
    ],
    [],
  );

  const requestOtp = async () => {
    setBusy(true);
    setNotice({});
    try {
      const response = await authApi.requestOtp(apiClient, currentPhone);
      setResendAvailableAt(response.resendAvailableAt);
      setNow(Date.now());
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

  const verifyAndLogin = async ({
    otpCode: submittedOtpCode,
  }: PhoneVerificationFormValues) => {
    setBusy(true);
    setNotice({});
    try {
      await authApi.verifyOtp(
        apiClient,
        currentPhone,
        submittedOtpCode,
      );
      if (context.pendingSession) {
        const refreshed = await authApi.refresh(
          apiClient,
          context.pendingSession.tokens.refreshToken,
        );
        onAuthenticated(toSession(refreshed));
        return;
      }
      if (!context.password) {
        throw new Error('Sign in again to finish phone verification.');
      }
      const response = await authApi.login(apiClient, {
        phoneE164: currentPhone,
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

  const changePhone = async () => {
    if (!context.accessToken) {
      setNotice({
        title: 'Sign in again',
        message: 'Return to login to safely change this phone number.',
        tone: 'warning',
      });
      return;
    }
    setBusy(true);
    setNotice({});
    try {
      const nextPhone = toE164(phoneDraft.countryCode, phoneDraft.nationalNumber);
      const response = await authApi.changeUnverifiedPhone(
        apiClient,
        context.accessToken,
        nextPhone,
        context.password,
      );
      setCurrentPhone(response.phoneE164);
      setPhoneDraft(phoneParts(response.phoneE164));
      setResendAvailableAt(response.otp.resendAvailableAt);
      setNow(Date.now());
      setOtpCode('');
      setEditingPhone(false);
      setNotice({
        title: 'Phone number updated',
        message: 'We sent a new verification code to the corrected number.',
        tone: 'success',
      });
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
          <Text style={styles.title}>Confirm your phone</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      ) : null}
      {appearance === 'auth' ? (
        <View style={styles.authPhoneField}>
          {phoneLabel ? <Text style={styles.authPhoneLabel}>{phoneLabel}</Text> : null}
          <View style={styles.authPhoneBox}>
            <Phone color={colors.icon} size={24} strokeWidth={1.8} />
            <Text style={styles.authPhoneValue}>
              {formatPhoneNumber(currentPhone)}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.phoneBox}>
          <Text style={styles.phoneLabel}>Phone number</Text>
          <Text style={styles.phoneValue}>{currentPhone}</Text>
        </View>
      )}
      {appearance === 'auth' && context.accessToken ? (
        editingPhone ? (
          <View style={styles.phoneCorrection}>
            <Text style={styles.correctionTitle}>Correct owner phone number</Text>
            <Text style={styles.correctionHelp}>The old code will be cancelled and a new code will be sent here.</Text>
            <PhoneNumberField
              label="Correct phone number"
              countryCode={phoneDraft.countryCode}
              nationalNumber={phoneDraft.nationalNumber}
              onChangeCountryCode={countryCode => setPhoneDraft(value => ({...value, countryCode}))}
              onChangeNationalNumber={nationalNumber => setPhoneDraft(value => ({...value, nationalNumber}))}
              appearance="auth"
              placeholder="7XXXXXXXX"
            />
            <View style={styles.correctionActions}>
              <AppButton label="Cancel" onPress={() => {setPhoneDraft(phoneParts(currentPhone)); setEditingPhone(false);}} variant="ghost" style={styles.actionButton} />
              <AppButton label="Send new code" onPress={changePhone} disabled={busy} variant="brand" style={styles.actionButton} />
            </View>
          </View>
        ) : (
          <Pressable accessibilityRole="button" onPress={() => setEditingPhone(true)}>
            <Text style={styles.changePhoneAction}>Wrong number? Change it safely</Text>
          </Pressable>
        )
      ) : null}
      <FormBuilder
        fields={appearance === 'auth' ? authOtpFields : OTP_FIELDS}
        defaultValues={{ otpCode: '' }}
        onSubmit={verifyAndLogin}
        submitLabel="Continue"
        busy={busy}
        appearance={appearance}
        submitVariant={appearance === 'auth' ? 'brand' : 'primary'}
        submitSize={appearance === 'auth' ? 'large' : 'default'}
        submitDisabled={appearance === 'auth' && otpCode.length !== 6}
        beforeSubmit={
          appearance === 'auth' ? (
            <View style={styles.resendPanel}>
              <Clock3 color={colors.icon} size={23} strokeWidth={1.8} />
              <Text style={styles.resendStatus}>
                {remainingSeconds > 0
                  ? `Resend available in ${formatDuration(remainingSeconds)}`
                  : 'You can request a new code'}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{
                  disabled: busy || remainingSeconds > 0,
                }}
                disabled={busy || remainingSeconds > 0}
                onPress={requestOtp}
                hitSlop={8}
              >
                <Text
                  style={[
                    styles.resendAction,
                    (busy || remainingSeconds > 0) &&
                      styles.resendActionDisabled,
                  ]}
                >
                  Resend code
                </Text>
              </Pressable>
            </View>
          ) : undefined
        }
        secondaryAction={
          appearance === 'default' ? (
            <AppButton
              label="Resend code"
              onPress={requestOtp}
              disabled={busy}
              variant="secondary"
              style={styles.actionButton}
            />
          ) : undefined
        }
        footer={
          appearance === 'auth' ? (
            <View style={styles.securityBanner}>
              <InfoBanner
                icon={
                  <View style={styles.securityIcon}>
                    <ShieldCheck
                      color={colors.brand}
                      size={25}
                      strokeWidth={1.8}
                    />
                  </View>
                }
                message={securityMessage}
              />
            </View>
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
    alignItems: 'center',
  },
  title: {
    color: colors.ink,
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 39,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  authPhoneBox: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.lg,
    minHeight: 64,
    paddingHorizontal: spacing.xl,
  },
  authPhoneField: {
    gap: spacing.xs,
  },
  authPhoneLabel: {
    ...typography.caption,
    color: colors.muted,
  },
  authPhoneValue: {
    ...typography.body,
    color: colors.text,
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
  resendPanel: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
    minHeight: 64,
    paddingHorizontal: spacing.lg,
  },
  resendStatus: {
    ...typography.caption,
    color: colors.muted,
    flex: 1,
  },
  resendAction: {
    ...typography.button,
    color: colors.brand,
  },
  resendActionDisabled: {
    opacity: 0.45,
  },
  securityBanner: {
    marginTop: spacing.md,
  },
  securityIcon: {
    alignItems: 'center',
    backgroundColor: '#DFF4E5',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  phoneCorrection: {
    backgroundColor: colors.background,
    borderRadius: 12,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  correctionTitle: {
    ...typography.button,
    color: colors.text,
  },
  correctionHelp: {
    ...typography.caption,
    color: colors.muted,
  },
  correctionActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  changePhoneAction: {
    ...typography.button,
    color: colors.brand,
    textAlign: 'center',
  },
});

function initialResendAvailableAt(
  context: PhoneVerificationContext,
): string | undefined {
  if (context.resendAvailableAt) {
    return context.resendAvailableAt;
  }

  // Registration sends the OTP but its response does not currently expose the
  // server timestamp. This only controls the visual timer; the API remains
  // authoritative and enforces the configured cooldown.
  return context.otpAlreadySent
    ? new Date(Date.now() + FALLBACK_RESEND_COOLDOWN_MS).toISOString()
    : undefined;
}

function secondsUntil(timestamp: string | undefined, now: number): number {
  if (!timestamp) {
    return 0;
  }

  const target = Date.parse(timestamp);
  if (Number.isNaN(target)) {
    return 0;
  }

  return Math.max(0, Math.ceil((target - now) / 1_000));
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatPhoneNumber(phoneE164: string): string {
  const match = phoneE164.match(/^(\+962)(\d{2})(\d{3})(\d{4})$/);
  if (match) {
    return `${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
  }

  return phoneE164;
}

function phoneParts(phoneE164: string): PhoneFieldValue {
  const callingCode = [...callingCodes]
    .sort((left, right) => right.code.length - left.code.length)
    .find(item => phoneE164.startsWith(item.code))?.code;
  if (callingCode) {
    return {
      countryCode: callingCode,
      nationalNumber: phoneE164.slice(callingCode.length),
    };
  }
  return {countryCode: '+962', nationalNumber: phoneE164.replace(/\D/g, '')};
}
