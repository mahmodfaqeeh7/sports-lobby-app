import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  FormBuilder,
  FormBuilderField,
  FormSection,
  PhoneFieldValue,
  toE164,
} from '../../../components';
import { apiClient } from '../../../services/api/apiClient';
import { colors, spacing, typography } from '../../../theme/tokens';
import { AuthLinks } from '../../auth/components/AuthLinks';
import { AuthView, PhoneVerificationContext } from '../../auth/types';
import { NoticeState, showError } from '../../auth/utils/authErrors';
import {
  EMAIL_PATTERN,
  requiredMessage,
  validatePassword,
  validatePhone,
} from '../../auth/utils/validation';
import { Sport, sportsApi } from '../../sports/api';
import { DocumentUpload, vendorApi } from '../../vendor/api';

type VendorSignupScreenProps = {
  onNavigate: (view: AuthView) => void;
  onPhoneVerificationRequired: (
    context: PhoneVerificationContext,
  ) => Promise<void>;
  setNotice: (notice: NoticeState) => void;
};

type VendorSignupFormValues = {
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
  businessName: string;
  contactEmail: string;
  phone: PhoneFieldValue;
  city: string;
  area: string;
  addressLine: string;
  selectedSportIds: string[];
  documentName: string;
};

const SEEDED_SPORTS: Sport[] = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    code: 'FOOTBALL',
    name: 'Football',
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    code: 'BASKETBALL',
    name: 'Basketball',
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    code: 'VOLLEYBALL',
    name: 'Volleyball',
  },
  {
    id: '10000000-0000-0000-0000-000000000004',
    code: 'TENNIS',
    name: 'Tennis',
  },
  { id: '10000000-0000-0000-0000-000000000005', code: 'PADEL', name: 'Padel' },
  {
    id: '10000000-0000-0000-0000-000000000006',
    code: 'BADMINTON',
    name: 'Badminton',
  },
];

const DEFAULT_VALUES: VendorSignupFormValues = {
  firstName: '',
  lastName: '',
  password: '',
  confirmPassword: '',
  businessName: '',
  contactEmail: '',
  phone: { countryCode: '+962', nationalNumber: '' },
  city: '',
  area: '',
  addressLine: '',
  selectedSportIds: [],
  documentName: '',
};

export function VendorSignupScreen({
  onNavigate,
  onPhoneVerificationRequired,
  setNotice,
}: VendorSignupScreenProps): React.JSX.Element {
  const [busy, setBusy] = useState(false);
  const [documentUpload, setDocumentUpload] = useState<DocumentUpload>();
  const [sports, setSports] = useState<Sport[]>(SEEDED_SPORTS);

  useEffect(() => {
    let active = true;

    sportsApi
      .list(apiClient)
      .then(nextSports => {
        if (active && nextSports.length > 0) {
          setSports(nextSports);
        }
      })
      .catch(() => {
        if (active) {
          setNotice({
            title: 'Using default sports',
            message:
              'The live sports catalog is not reachable, so the signup form is using the default saved sports.',
            tone: 'warning',
          });
        }
      });

    return () => {
      active = false;
    };
  }, [setNotice]);

  const fields = useMemo<FormBuilderField<VendorSignupFormValues>[]>(
    () => [
      {
        type: 'text',
        name: 'firstName',
        label: 'First name',
        autoCapitalize: 'words',
        rules: { required: requiredMessage('First name') },
      },
      {
        type: 'text',
        name: 'lastName',
        label: 'Last name',
        autoCapitalize: 'words',
        rules: { required: requiredMessage('Last name') },
      },
      {
        type: 'password',
        name: 'password',
        label: 'Password',
        rules: { validate: validatePassword },
      },
      {
        type: 'password',
        name: 'confirmPassword',
        label: 'Confirm password',
        rules: {
          required: requiredMessage('Password confirmation'),
          validate: (value, formValues) =>
            value === formValues.password || 'Passwords do not match.',
        },
      },
      {
        type: 'text',
        name: 'businessName',
        label: 'Business name',
        autoCapitalize: 'words',
        rules: { required: requiredMessage('Business name') },
      },
      {
        type: 'text',
        name: 'contactEmail',
        label: 'Business email',
        keyboardType: 'email-address',
        rules: {
          required: requiredMessage('Business email'),
          pattern: {
            value: EMAIL_PATTERN,
            message: 'Enter a valid email address.',
          },
        },
      },
      {
        type: 'phone',
        name: 'phone',
        label: 'Business phone',
        rules: { validate: validatePhone },
      },
      {
        type: 'text',
        name: 'city',
        label: 'City',
        autoCapitalize: 'words',
        rules: { required: requiredMessage('City') },
      },
      { type: 'text', name: 'area', label: 'Area', autoCapitalize: 'words' },
      {
        type: 'text',
        name: 'addressLine',
        label: 'Address',
        autoCapitalize: 'words',
        rules: { required: requiredMessage('Address') },
      },
      {
        type: 'chips',
        name: 'selectedSportIds',
        label: 'Sports offered',
        options: sports.map(sport => ({ key: sport.id, label: sport.name })),
        emptyText: 'No sports available',
        rules: {
          validate: value =>
            (Array.isArray(value) && value.length > 0) ||
            'Choose at least one sport.',
        },
      },
      {
        type: 'text',
        name: 'documentName',
        label: 'Verification document file name',
        placeholder: 'business-license.pdf',
        rules: { required: requiredMessage('Verification document') },
      },
    ],
    [sports],
  );

  const signupVendor = async (values: VendorSignupFormValues) => {
    setBusy(true);
    setNotice({});
    try {
      const contactPhone = toE164(
        values.phone.countryCode,
        values.phone.nationalNumber,
      );
      const selectedSportNames = sports
        .filter(sport => values.selectedSportIds.includes(sport.id))
        .map(sport => sport.name);
      const response = await vendorApi.signup(apiClient, {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.contactEmail,
        phoneE164: contactPhone,
        password: values.password,
        deviceLabel: 'Sports Lobby mobile',
        businessName: values.businessName,
        contactPhone,
        contactEmail: values.contactEmail,
        countryCode: 'JO',
        city: values.city,
        area: values.area,
        addressLine: values.addressLine,
        latitude: 31.9501,
        longitude: 35.9106,
        supportedSports: selectedSportNames.join(', '),
        venueCountEstimate: 1,
        openingHours: 'Daily 08:00-23:00',
        verificationDocuments: [
          {
            documentType: 'BUSINESS_LICENSE',
            fileName: values.documentName,
            contentType: values.documentName.toLowerCase().endsWith('.jpg')
              ? 'image/jpeg'
              : 'application/pdf',
            sizeBytes: 1024,
          },
        ],
      });
      setDocumentUpload(response.documentUploads[0]);
      await onPhoneVerificationRequired({
        phoneE164: response.user.phoneE164,
        password: values.password,
        title: 'Vendor application submitted',
        otpAlreadySent: true,
      });
    } catch (error) {
      showError(error, setNotice);
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormSection
      title="Vendor Application"
      subtitle="Create the owner account, add business details, and submit verification."
    >
      <FormBuilder
        fields={fields}
        defaultValues={DEFAULT_VALUES}
        onSubmit={signupVendor}
        submitLabel="Submit vendor application"
        busy={busy}
        footer={
          <>
            <AuthLinks
              items={[
                {
                  text: 'Already have an account? Log in',
                  onPress: () => onNavigate('login'),
                },
              ]}
            />
            {documentUpload ? (
              <View style={styles.uploadBox}>
                <Text style={styles.uploadTitle}>Document upload is ready</Text>
                <Text style={styles.uploadText}>{documentUpload.fileId}</Text>
              </View>
            ) : null}
          </>
        }
      />
    </FormSection>
  );
}

const styles = StyleSheet.create({
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
