import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import Check from 'lucide-react-native/icons/check';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import Send from 'lucide-react-native/icons/send';
import ShieldCheck from 'lucide-react-native/icons/shield-check';
import { UseFormReturn } from 'react-hook-form';
import {
  AppButton,
  FormBuilder,
  FormBuilderField,
  InfoBanner,
  PhoneFieldValue,
  TextField,
  toE164,
} from '../../../components';
import { apiClient } from '../../../services/api/apiClient';
import { colors, spacing } from '../../../theme/tokens';
import { AuthBrand } from '../components/AuthBrand';
import { AuthPromptLink } from '../components/AuthPromptLink';
import { authApi } from '../api';
import { AuthView } from '../types';
import { NoticeState, showError } from '../utils/authErrors';
import {
  requiredMessage,
  validatePassword,
  validatePhone,
} from '../utils/validation';

type ForgotPasswordScreenProps = {
  onNavigate: (view: AuthView) => void;
  setNotice: (notice: NoticeState) => void;
};

type ResetPasswordFormValues = {
  phone: PhoneFieldValue;
  resetToken: string;
  newPassword: string;
  confirmPassword: string;
};

const RESET_FIELDS: FormBuilderField<ResetPasswordFormValues>[] = [
  {
    type: 'phone',
    name: 'phone',
    label: 'Phone number',
    placeholder: '7X XXX XXXX',
    rules: { validate: validatePhone },
  },
  {
    type: 'custom',
    name: 'resetToken',
    rules: { required: requiredMessage('Reset code') },
    render: ({ field, fieldState }) => (
      <TextField
        label="Reset code"
        value={typeof field.value === 'string' ? field.value : ''}
        onChangeText={field.onChange}
        onBlur={field.onBlur}
        placeholder="Enter reset code"
        errorText={fieldState.error?.message}
        appearance="auth"
        leadingIcon={
          <ShieldCheck color={colors.brand} size={22} strokeWidth={1.8} />
        }
        trailingAccessory={
          <Pressable
            accessibilityLabel="Paste reset code"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => {
              Clipboard.getString().then(value => {
                if (value.trim()) {
                  field.onChange(value.trim());
                }
              });
            }}
            style={styles.pasteButton}
          >
            <Text style={styles.pasteLabel}>Paste</Text>
          </Pressable>
        }
      />
    ),
  },
  {
    type: 'password',
    name: 'newPassword',
    label: 'New password',
    placeholder: 'Enter new password',
    rules: { validate: validatePassword },
  },
  {
    type: 'password',
    name: 'confirmPassword',
    label: 'Confirm new password',
    placeholder: 'Confirm new password',
    rules: {
      required: requiredMessage('Password confirmation'),
      validate: (value, formValues) =>
        value === formValues.newPassword || 'Passwords do not match.',
    },
  },
];

const DEFAULT_VALUES: ResetPasswordFormValues = {
  phone: { countryCode: '+962', nationalNumber: '' },
  resetToken: '',
  newPassword: '',
  confirmPassword: '',
};

export function ForgotPasswordScreen({
  onNavigate,
  setNotice,
}: ForgotPasswordScreenProps): React.JSX.Element {
  const [requestBusy, setRequestBusy] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const [requestedPhone, setRequestedPhone] = useState<string>();
  const formRef = useRef<UseFormReturn<ResetPasswordFormValues> | null>(null);

  const requestResetCode = async () => {
    const form = formRef.current;
    if (!form) {
      return;
    }

    const phoneIsValid = await form.trigger('phone', { shouldFocus: true });
    if (!phoneIsValid) {
      return;
    }

    setRequestBusy(true);
    setNotice({});
    try {
      const phone = form.getValues('phone');
      const phoneE164 = toE164(phone.countryCode, phone.nationalNumber);
      await authApi.forgotPassword(apiClient, phoneE164);
      setRequestedPhone(phoneE164);
    } catch (error) {
      showError(error, setNotice);
    } finally {
      setRequestBusy(false);
    }
  };

  const resetPassword = async ({
    resetToken,
    newPassword,
  }: ResetPasswordFormValues) => {
    if (!requestedPhone) {
      return;
    }

    setResetBusy(true);
    setNotice({});
    try {
      await authApi.resetPassword(apiClient, resetToken.trim(), newPassword);
      onNavigate('login');
      setNotice({
        title: 'Password updated',
        message: 'You can sign in with your new password.',
        tone: 'success',
      });
    } catch (error) {
      showError(error, setNotice);
    } finally {
      setResetBusy(false);
    }
  };

  return (
    <View style={styles.screen}>
      <AuthBrand />

      <View style={styles.heading}>
        <Text style={styles.title}>Reset your password</Text>
        <Text style={styles.subtitle}>
          Enter your phone number, reset code, and a new password.
        </Text>
      </View>

      <FormBuilder
        fields={RESET_FIELDS}
        defaultValues={DEFAULT_VALUES}
        onSubmit={resetPassword}
        submitLabel="Update password"
        busy={resetBusy}
        appearance="auth"
        submitVariant="brand"
        submitSize="large"
        submitDisabled={!requestedPhone || requestBusy}
        formRef={formRef}
        beforeSubmit={
          <>
            {requestedPhone ? (
              <InfoBanner
                title="Code sent successfully"
                icon={
                  <View style={styles.successIcon}>
                    <Check color={colors.brand} size={24} strokeWidth={2} />
                  </View>
                }
                message={`We sent reset instructions to ${requestedPhone}. Use the code before it expires.`}
              />
            ) : null}
            <AppButton
              label={requestedPhone ? 'Send another code' : 'Send reset code'}
              onPress={requestResetCode}
              disabled={requestBusy || resetBusy}
              loading={requestBusy}
              variant="brandOutline"
              size="large"
              icon={<Send color={colors.brand} size={21} strokeWidth={1.8} />}
            />
          </>
        }
        footer={
          <AuthPromptLink
            prompt=""
            action="Back to login"
            onPress={() => onNavigate('login')}
            icon={
              <ChevronLeft color={colors.brand} size={20} strokeWidth={2} />
            }
          />
        }
      />
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
  heading: {
    alignItems: 'center',
    gap: spacing.sm,
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
    maxWidth: 360,
    textAlign: 'center',
  },
  pasteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 56,
  },
  pasteLabel: {
    color: colors.brand,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  successIcon: {
    alignItems: 'center',
    borderColor: colors.brand,
    borderRadius: 22,
    borderWidth: 1.5,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
});
