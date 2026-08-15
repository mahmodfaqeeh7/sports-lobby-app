import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Mail from 'lucide-react-native/icons/mail';
import ShieldCheck from 'lucide-react-native/icons/shield-check';
import UserRound from 'lucide-react-native/icons/user-round';
import {
  FormBuilder,
  FormBuilderField,
  InfoBanner,
  PhoneFieldValue,
  Stepper,
  StepperStep,
  toE164,
} from '../../../components';
import { apiClient } from '../../../services/api/apiClient';
import { AuthenticatedSession } from '../../../services/session/sessionTypes';
import { colors, spacing } from '../../../theme/tokens';
import { AuthBrand } from '../components/AuthBrand';
import { LegalConsentField } from '../components/LegalConsentField';
import { AuthPromptLink } from '../components/AuthPromptLink';
import { authApi, toSession } from '../api';
import { AuthView, PhoneVerificationContext } from '../types';
import { NoticeState, showError } from '../utils/authErrors';
import {
  EMAIL_PATTERN,
  requiredMessage,
  validatePassword,
  validatePhone,
} from '../utils/validation';
import { PhoneVerificationScreen } from './PhoneVerificationScreen';

type PlayerSignupFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: PhoneFieldValue;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
};

const fieldIconProps = {
  color: colors.icon,
  size: 21,
  strokeWidth: 1.8,
} as const;

const PLAYER_SIGNUP_FIELDS: FormBuilderField<PlayerSignupFormValues>[] = [
  {
    type: 'text',
    name: 'firstName',
    label: 'First name',
    placeholder: 'First name',
    autoCapitalize: 'words',
    hideLabel: true,
    row: 'name',
    leadingIcon: <UserRound {...fieldIconProps} />,
    rules: { required: requiredMessage('First name') },
  },
  {
    type: 'text',
    name: 'lastName',
    label: 'Last name',
    placeholder: 'Last name',
    autoCapitalize: 'words',
    hideLabel: true,
    row: 'name',
    leadingIcon: <UserRound {...fieldIconProps} />,
    rules: { required: requiredMessage('Last name') },
  },
  {
    type: 'text',
    name: 'email',
    label: 'Email',
    placeholder: 'Email',
    keyboardType: 'email-address',
    hideLabel: true,
    leadingIcon: <Mail {...fieldIconProps} />,
    rules: {
      required: requiredMessage('Email'),
      pattern: {
        value: EMAIL_PATTERN,
        message: 'Enter a valid email address.',
      },
    },
  },
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
    rules: { validate: validatePassword },
  },
  {
    type: 'password',
    name: 'confirmPassword',
    label: 'Confirm password',
    placeholder: 'Confirm password',
    hideLabel: true,
    rules: {
      required: requiredMessage('Password confirmation'),
      validate: (value, formValues) =>
        value === formValues.password || 'Passwords do not match.',
    },
  },
  {
    type: 'custom',
    name: 'acceptedTerms',
    rules: {validate: value => value === true || 'Accept the Terms of Service to continue.'},
    render: ({field, fieldState}) => (
      <LegalConsentField document="terms" accepted={field.value === true} onChange={field.onChange} onBlur={field.onBlur} errorText={fieldState.error?.message} />
    ),
  },
  {
    type: 'custom',
    name: 'acceptedPrivacy',
    rules: {validate: value => value === true || 'Accept the Privacy Policy to continue.'},
    render: ({field, fieldState}) => (
      <LegalConsentField document="privacy" accepted={field.value === true} onChange={field.onChange} onBlur={field.onBlur} errorText={fieldState.error?.message} />
    ),
  },
];

const DEFAULT_VALUES: PlayerSignupFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: { countryCode: '+962', nationalNumber: '' },
  password: '',
  confirmPassword: '',
  acceptedTerms: false,
  acceptedPrivacy: false,
};

type PlayerSignupScreenProps = {
  onAuthenticated: (session: AuthenticatedSession) => void;
  onNavigate: (view: AuthView) => void;
  setNotice: (notice: NoticeState) => void;
};

export function PlayerSignupScreen({
  onAuthenticated,
  onNavigate,
  setNotice,
}: PlayerSignupScreenProps): React.JSX.Element {
  const [busy, setBusy] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [verificationContext, setVerificationContext] =
    useState<PhoneVerificationContext>();

  const register = async ({
    firstName,
    lastName,
    email,
    phone,
    password,
    acceptedTerms,
    acceptedPrivacy,
  }: PlayerSignupFormValues) => {
    setBusy(true);
    setNotice({});
    try {
      const phoneE164 = toE164(phone.countryCode, phone.nationalNumber);
      const response = await authApi.registerPlayer(apiClient, {
        firstName,
        lastName,
        email,
        phoneE164,
        password,
        deviceLabel: 'Sports Lobby mobile',
        acceptedTerms,
        acceptedPrivacy,
      });
      setVerificationContext({
        phoneE164: response.user.phoneE164,
        password,
        title: 'Account created',
        otpAlreadySent: true,
        accessToken: response.tokens.accessToken,
        pendingSession: toSession(response),
      });
      setActiveStep(1);
    } catch (error) {
      showError(error, setNotice);
    } finally {
      setBusy(false);
    }
  };

  const steps: StepperStep[] = [
    {
      key: 'account',
      label: 'Account',
      content: (
        <View style={styles.stepScreen}>
          <View style={styles.heading}>
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>
              Join games, reserve seats, and play anytime.
            </Text>
          </View>

          <FormBuilder
            fields={PLAYER_SIGNUP_FIELDS}
            defaultValues={DEFAULT_VALUES}
            onSubmit={register}
            submitLabel="Create account"
            busy={busy}
            appearance="auth"
            submitVariant="brand"
            submitSize="large"
            beforeSubmit={
              <InfoBanner
                icon={
                  <ShieldCheck
                    color={colors.brand}
                    size={30}
                    strokeWidth={1.8}
                  />
                }
                message="Your phone helps secure your account and verify reservations."
              />
            }
            footer={
              <AuthPromptLink
                prompt="Already have an account? "
                action="Log in"
                onPress={() => onNavigate('login')}
              />
            }
          />
        </View>
      ),
    },
    {
      key: 'verify',
      label: 'Verify',
      content: verificationContext ? (
        <PhoneVerificationScreen
          context={verificationContext}
          onAuthenticated={onAuthenticated}
          onNavigate={onNavigate}
          setNotice={setNotice}
          appearance="auth"
          onStartOver={() => {
            setNotice({});
            onNavigate('login');
          }}
        />
      ) : null,
    },
  ];

  return (
    <View style={styles.screen}>
      <AuthBrand />
      <Stepper steps={steps} activeStep={activeStep} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignSelf: 'center',
    gap: spacing.xl,
    maxWidth: 500,
    width: '100%',
  },
  stepScreen: {
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
});
