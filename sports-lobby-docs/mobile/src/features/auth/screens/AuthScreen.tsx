import React, {useEffect, useMemo, useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {AppButton, AppScreen, AppTextField, FormSection, MultiSelectChips, Notice, PhoneNumberField, toE164} from '../../../components';
import {ApiClientError, apiClient} from '../../../services/api/apiClient';
import {AuthenticatedSession} from '../../../services/session/sessionTypes';
import {colors, spacing, typography} from '../../../theme/tokens';
import {Sport, sportsApi} from '../../sports/api';
import {DocumentUpload, vendorApi} from '../../vendor/api';
import {authApi, toSession} from '../api';

type AuthScreenProps = {
  onAuthenticated: (session: AuthenticatedSession) => void;
};

type AuthView = 'login' | 'playerSignup' | 'vendorSignup' | 'confirmPhone' | 'forgotPassword';

type NoticeState = {
  title?: string;
  message?: string;
  tone?: 'info' | 'success' | 'error' | 'warning';
};

const SEEDED_SPORTS: Sport[] = [
  {id: '10000000-0000-0000-0000-000000000001', code: 'FOOTBALL', name: 'Football'},
  {id: '10000000-0000-0000-0000-000000000002', code: 'BASKETBALL', name: 'Basketball'},
  {id: '10000000-0000-0000-0000-000000000003', code: 'VOLLEYBALL', name: 'Volleyball'},
  {id: '10000000-0000-0000-0000-000000000004', code: 'TENNIS', name: 'Tennis'},
  {id: '10000000-0000-0000-0000-000000000005', code: 'PADEL', name: 'Padel'},
  {id: '10000000-0000-0000-0000-000000000006', code: 'BADMINTON', name: 'Badminton'},
];

export function AuthScreen({onAuthenticated}: AuthScreenProps): React.JSX.Element {
  const [view, setView] = useState<AuthView>('login');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<NoticeState>({});
  const [documentUpload, setDocumentUpload] = useState<DocumentUpload>();
  const [verificationPhone, setVerificationPhone] = useState('');
  const [sports, setSports] = useState<Sport[]>(SEEDED_SPORTS);
  const [sportsLoading, setSportsLoading] = useState(false);
  const [sportsLoadedFromApi, setSportsLoadedFromApi] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneCountryCode, setPhoneCountryCode] = useState('+962');
  const [phoneNationalNumber, setPhoneNationalNumber] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [businessName, setBusinessName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [vendorPhoneCountryCode, setVendorPhoneCountryCode] = useState('+962');
  const [vendorPhoneNationalNumber, setVendorPhoneNationalNumber] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [selectedSportIds, setSelectedSportIds] = useState<string[]>([]);
  const [documentName, setDocumentName] = useState('');

  useEffect(() => {
    if (view !== 'vendorSignup' || sportsLoadedFromApi || sportsLoading) {
      return;
    }

    let active = true;
    setSportsLoading(true);
    sportsApi
      .list(apiClient)
      .then(nextSports => {
        if (active) {
          setSports(nextSports);
        }
      })
      .catch(() => {
        if (active) {
          setNotice({
            title: 'Using default sports',
            message: 'The live sports catalog is not reachable, so the signup form is using the default saved sports.',
            tone: 'warning',
          });
        }
      })
      .finally(() => {
        if (active) {
          setSportsLoadedFromApi(true);
          setSportsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [sportsLoadedFromApi, sportsLoading, view]);

  const selectedSportNames = useMemo(
    () => sports.filter(sport => selectedSportIds.includes(sport.id)).map(sport => sport.name),
    [selectedSportIds, sports],
  );

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setNotice({});
    try {
      await action();
    } catch (error) {
      showError(error, setNotice);
    } finally {
      setBusy(false);
    }
  };

  const login = () =>
    run(async () => {
      const phoneE164 = getAccountPhone();
      requireFields([
        ['Phone number', phoneNationalNumber],
        ['Password', password],
      ]);
      const response = await authApi.login(apiClient, {phoneE164, password, deviceLabel: 'Sports Lobby mobile'});
      if (!response.user.phoneVerified) {
        await beginPhoneConfirmation(response.user.phoneE164, 'Confirm your phone to continue');
        return;
      }
      onAuthenticated(toSession(response));
    });

  const registerPlayer = () =>
    run(async () => {
      const phoneE164 = getAccountPhone();
      requireFields([
        ['First name', firstName],
        ['Last name', lastName],
        ['Email', email],
        ['Phone number', phoneNationalNumber],
        ['Password', password],
      ]);
      const response = await authApi.registerPlayer(apiClient, {
        firstName,
        lastName,
        email,
        phoneE164,
        password,
        deviceLabel: 'Sports Lobby mobile',
      });
      beginPhoneConfirmation(response.user.phoneE164, 'Account created', true);
    });

  const requestOtp = () =>
    run(async () => {
      await authApi.requestOtp(apiClient, verificationPhone);
      setNotice({title: 'Code sent', message: 'Enter the 6-digit code to finish verification.', tone: 'success'});
    });

  const verifyAndLogin = () =>
    run(async () => {
      requireFields([
        ['Verification code', otpCode],
        ['Password', password],
      ]);
      await authApi.verifyOtp(apiClient, verificationPhone, otpCode);
      const response = await authApi.login(apiClient, {phoneE164: verificationPhone, password, deviceLabel: 'Sports Lobby mobile'});
      onAuthenticated(toSession(response));
    });

  const forgotPassword = () =>
    run(async () => {
      const phoneE164 = getAccountPhone();
      requireFields([['Phone number', phoneNationalNumber]]);
      await authApi.forgotPassword(apiClient, phoneE164);
      setNotice({title: 'Reset requested', message: 'Enter the reset token and choose a new password.', tone: 'success'});
    });

  const resetPassword = () =>
    run(async () => {
      requireFields([
        ['Reset token', resetToken],
        ['New password', newPassword],
      ]);
      await authApi.resetPassword(apiClient, resetToken, newPassword);
      setNotice({title: 'Password updated', message: 'You can sign in with your new password.', tone: 'success'});
      setView('login');
    });

  const signupVendor = () =>
    run(async () => {
      const contactPhone = getVendorPhone();
      requireFields([
        ['First name', firstName],
        ['Last name', lastName],
        ['Password', password],
        ['Business name', businessName],
        ['Business email', contactEmail],
        ['Business phone', vendorPhoneNationalNumber],
        ['City', city],
        ['Address', addressLine],
        ['Sports offered', selectedSportIds.join(',')],
      ]);
      const response = await vendorApi.signup(apiClient, {
        firstName,
        lastName,
        email: contactEmail,
        phoneE164: contactPhone,
        password,
        deviceLabel: 'Sports Lobby mobile',
        businessName,
        contactPhone,
        contactEmail,
        countryCode: 'JO',
        city,
        area,
        addressLine,
        latitude: 31.9501,
        longitude: 35.9106,
        supportedSports: selectedSportNames.join(', '),
        venueCountEstimate: 1,
        openingHours: 'Daily 08:00-23:00',
        verificationDocuments: [
          {
            documentType: 'BUSINESS_LICENSE',
            fileName: documentName || 'business-license.pdf',
            contentType: (documentName || '').toLowerCase().endsWith('.jpg') ? 'image/jpeg' : 'application/pdf',
            sizeBytes: 1024,
          },
        ],
      });
      setDocumentUpload(response.documentUploads[0]);
      beginPhoneConfirmation(response.user.phoneE164, 'Vendor application submitted', true);
    });

  const beginPhoneConfirmation = async (phone: string, title: string, otpAlreadySent = false) => {
    setVerificationPhone(phone);
    setOtpCode('');
    setView('confirmPhone');
    if (!otpAlreadySent) {
      await authApi.requestOtp(apiClient, phone);
    }
    setNotice({
      title,
      message: 'We sent a verification code to your phone. Enter it to continue.',
      tone: 'success',
    });
  };

  return (
    <AppScreen title={screenTitle(view)} subtitle={screenSubtitle(view)}>
      <Notice title={notice.title} message={notice.message} tone={notice.tone} onDismiss={() => setNotice({})} />
      {view === 'login' ? renderLogin() : null}
      {view === 'playerSignup' ? renderPlayerSignup() : null}
      {view === 'vendorSignup' ? renderVendorSignup() : null}
      {view === 'confirmPhone' ? renderConfirmPhone() : null}
      {view === 'forgotPassword' ? renderForgotPassword() : null}
    </AppScreen>
  );

  function renderLogin(): React.JSX.Element {
    return (
      <FormSection title="Log in">
        <PhoneNumberField
          label="Phone number"
          countryCode={phoneCountryCode}
          onChangeCountryCode={setPhoneCountryCode}
          nationalNumber={phoneNationalNumber}
          onChangeNationalNumber={setPhoneNationalNumber}
        />
        <AppTextField label="Password" value={password} onChangeText={setPassword} secureTextEntry />
        <AppButton label="Log in" onPress={login} disabled={busy} />
        <View style={styles.links}>
          <InlineLink text="Don't have account? Sign up" onPress={() => setView('playerSignup')} />
          <InlineLink text="Are you a vendor? Sign up as a Vendor" onPress={() => setView('vendorSignup')} />
          <InlineLink text="Forgot password?" onPress={() => setView('forgotPassword')} />
        </View>
      </FormSection>
    );
  }

  function renderPlayerSignup(): React.JSX.Element {
    return (
      <View style={styles.stack}>
        <FormSection title="Create Player Account">
          <View style={styles.nameRow}>
            <AppTextField label="First name" value={firstName} onChangeText={setFirstName} />
            <AppTextField label="Last name" value={lastName} onChangeText={setLastName} />
          </View>
          <AppTextField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
          <PhoneNumberField
            label="Phone number"
            countryCode={phoneCountryCode}
            onChangeCountryCode={setPhoneCountryCode}
            nationalNumber={phoneNationalNumber}
            onChangeNationalNumber={setPhoneNationalNumber}
          />
          <AppTextField label="Password" value={password} onChangeText={setPassword} secureTextEntry />
          <AppButton label="Create account" onPress={registerPlayer} disabled={busy} />
          <InlineLink text="Already have an account? Log in" onPress={() => setView('login')} />
        </FormSection>
      </View>
    );
  }

  function renderVendorSignup(): React.JSX.Element {
    return (
      <View style={styles.stack}>
        <FormSection title="Vendor Account">
          <View style={styles.nameRow}>
            <AppTextField label="First name" value={firstName} onChangeText={setFirstName} />
            <AppTextField label="Last name" value={lastName} onChangeText={setLastName} />
          </View>
          <AppTextField label="Password" value={password} onChangeText={setPassword} secureTextEntry />
        </FormSection>
        <FormSection title="Business Information">
          <AppTextField label="Business name" value={businessName} onChangeText={setBusinessName} />
          <AppTextField label="Business email" value={contactEmail} onChangeText={setContactEmail} keyboardType="email-address" />
          <PhoneNumberField
            label="Business phone"
            countryCode={vendorPhoneCountryCode}
            onChangeCountryCode={setVendorPhoneCountryCode}
            nationalNumber={vendorPhoneNationalNumber}
            onChangeNationalNumber={setVendorPhoneNationalNumber}
          />
          <AppTextField label="City" value={city} onChangeText={setCity} />
          <AppTextField label="Area" value={area} onChangeText={setArea} />
          <AppTextField label="Address" value={addressLine} onChangeText={setAddressLine} />
          <MultiSelectChips
            label="Sports offered"
            options={sports.map(sport => ({key: sport.id, label: sport.name}))}
            selectedKeys={selectedSportIds}
            onChange={setSelectedSportIds}
            emptyText="No sports available"
          />
        </FormSection>
        <FormSection title="Verification Document">
          <AppTextField label="Document file name" value={documentName} onChangeText={setDocumentName} placeholder="business-license.pdf" />
          <AppButton label="Submit vendor application" onPress={signupVendor} disabled={busy} />
          <InlineLink text="Already have an account? Log in" onPress={() => setView('login')} />
          {documentUpload ? (
            <View style={styles.uploadBox}>
              <Text style={styles.uploadTitle}>Document upload is ready</Text>
              <Text style={styles.uploadText}>{documentUpload.fileId}</Text>
            </View>
          ) : null}
        </FormSection>
      </View>
    );
  }

  function renderConfirmPhone(): React.JSX.Element {
    return (
      <FormSection title="Confirm Your Phone" subtitle="This step is required before you can use Sports Lobby.">
        <View style={styles.phoneBox}>
          <Text style={styles.phoneLabel}>Phone number</Text>
          <Text style={styles.phoneValue}>{verificationPhone}</Text>
        </View>
        <AppTextField label="Verification code" value={otpCode} onChangeText={setOtpCode} keyboardType="number-pad" />
        <View style={styles.actions}>
          <AppButton label="Resend code" onPress={requestOtp} disabled={busy} variant="secondary" />
          <AppButton label="Continue" onPress={verifyAndLogin} disabled={busy} />
        </View>
        <InlineLink text="Use another account" onPress={() => setView('login')} />
      </FormSection>
    );
  }

  function renderForgotPassword(): React.JSX.Element {
    return (
      <FormSection title="Reset Password">
        <PhoneNumberField
          label="Phone number"
          countryCode={phoneCountryCode}
          onChangeCountryCode={setPhoneCountryCode}
          nationalNumber={phoneNationalNumber}
          onChangeNationalNumber={setPhoneNationalNumber}
        />
        <AppButton label="Send reset code" onPress={forgotPassword} disabled={busy} variant="secondary" />
        <AppTextField label="Reset token" value={resetToken} onChangeText={setResetToken} />
        <AppTextField label="New password" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
        <AppButton label="Update password" onPress={resetPassword} disabled={busy || !resetToken} />
        <InlineLink text="Back to log in" onPress={() => setView('login')} />
      </FormSection>
    );
  }

  function getAccountPhone(): string {
    return toE164(phoneCountryCode, phoneNationalNumber);
  }

  function getVendorPhone(): string {
    return toE164(vendorPhoneCountryCode, vendorPhoneNationalNumber);
  }
}

function InlineLink({text, onPress}: {text: string; onPress: () => void}): React.JSX.Element {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.linkWrap}>
      <Text style={styles.linkText}>{text}</Text>
    </Pressable>
  );
}

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

export function showError(error: unknown, setNotice: (notice: NoticeState) => void): void {
  if (error instanceof FormError) {
    setNotice({title: 'Check the form', message: error.message, tone: 'warning'});
    return;
  }
  if (error instanceof ApiClientError) {
    setNotice({title: 'Request failed', message: formatApiError(error), tone: 'error'});
    return;
  }
  setNotice({title: 'Request failed', message: error instanceof Error ? error.message : 'Unexpected error', tone: 'error'});
}

class FormError extends Error {}

function requireFields(fields: [string, string][]): void {
  const missing = fields.filter(([, value]) => !value.trim()).map(([label]) => label);
  if (missing.length > 0) {
    throw new FormError(`Please fill: ${missing.join(', ')}.`);
  }
}

function formatApiError(error: ApiClientError): string {
  const message = error.body?.error.message ?? error.message;
  const details = error.body?.error.details;
  if (!details || Object.keys(details).length === 0) {
    return message;
  }
  const detailText = Object.entries(details)
    .map(([field, value]) => `${field}: ${String(value)}`)
    .join('\n');
  return `${message}\n${detailText}`;
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  links: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  linkWrap: {
    minHeight: 32,
    justifyContent: 'center',
  },
  linkText: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '700',
    textAlign: 'center',
  },
  nameRow: {
    gap: spacing.md,
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
  uploadBox: {
    backgroundColor: colors.background,
    borderRadius: 8,
    gap: spacing.xs,
    padding: spacing.md,
  },
  uploadTitle: {
    ...typography.button,
    color: colors.text,
  },
  uploadText: {
    ...typography.caption,
    color: colors.muted,
  },
});
