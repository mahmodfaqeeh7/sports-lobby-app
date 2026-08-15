import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Activity from 'lucide-react-native/icons/activity';
import CircleDot from 'lucide-react-native/icons/circle-dot';
import Globe from 'lucide-react-native/icons/globe';
import House from 'lucide-react-native/icons/house';
import Info from 'lucide-react-native/icons/info';
import Mail from 'lucide-react-native/icons/mail';
import Map from 'lucide-react-native/icons/map';
import MapPin from 'lucide-react-native/icons/map-pin';
import Store from 'lucide-react-native/icons/store';
import UserRound from 'lucide-react-native/icons/user-round';
import Volleyball from 'lucide-react-native/icons/volleyball';
import type { UseFormReturn } from 'react-hook-form';
import {
  AppButton,
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
import { colors, radii, spacing, typography } from '../../../theme/tokens';
import { AuthBrand } from '../../auth/components/AuthBrand';
import { LegalConsentField } from '../../auth/components/LegalConsentField';
import { AuthPromptLink } from '../../auth/components/AuthPromptLink';
import { AuthView, PhoneVerificationContext } from '../../auth/types';
import { NoticeState, showError } from '../../auth/utils/authErrors';
import {
  EMAIL_PATTERN,
  requiredMessage,
  validatePassword,
  validatePhone,
} from '../../auth/utils/validation';
import { PhoneVerificationScreen } from '../../auth/screens/PhoneVerificationScreen';
import {toSession} from '../../auth/api';
import { Sport, sportsApi } from '../../sports/api';
import { DocumentUpload, vendorApi } from '../../vendor/api';
import { VerificationDocumentField } from '../components/VerificationDocumentField';
import {BusinessImageField} from '../components/BusinessImageField';
import {
  OpeningHoursField,
  OpeningHoursValue,
  serializeOpeningHours,
  validateOpeningHours,
} from '../components/OpeningHoursField';
import {
  pickVerificationDocument,
  pickBusinessImage,
  removeLocalDocument,
  SelectedVerificationDocument,
  uploadVerificationDocument,
} from '../documentUpload';

type VendorSignupScreenProps = {
  onAuthenticated: (session: AuthenticatedSession) => void;
  onNavigate: (view: AuthView) => void;
  setNotice: (notice: NoticeState) => void;
};

type AccountFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: PhoneFieldValue;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
};

type BusinessFormValues = {
  businessName: string;
  contactEmail: string;
  phone: PhoneFieldValue;
  city: string;
  area: string;
  addressLine: string;
  country: string;
  openingHours: OpeningHoursValue;
  selectedSportIds: string[];
  documentName: string;
  logoName: string;
  facilityImageName: string;
};

type PendingVendorUpload = {
  files: {document: SelectedVerificationDocument; instructions: DocumentUpload}[];
  verificationContext: PhoneVerificationContext;
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

const iconProps = {
  color: colors.icon,
  size: 21,
  strokeWidth: 1.8,
} as const;

const sportIconProps = {
  color: colors.brand,
  size: 18,
  strokeWidth: 1.8,
} as const;

const ACCOUNT_DEFAULT_VALUES: AccountFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: { countryCode: '+962', nationalNumber: '' },
  password: '',
  confirmPassword: '',
  acceptedTerms: false,
  acceptedPrivacy: false,
};

const BUSINESS_DEFAULT_VALUES: BusinessFormValues = {
  businessName: '',
  contactEmail: '',
  phone: { countryCode: '+962', nationalNumber: '' },
  city: '',
  area: '',
  addressLine: '',
  country: 'Jordan',
  openingHours: { opensAt: '', closesAt: '' },
  selectedSportIds: [],
  documentName: '',
  logoName: '',
  facilityImageName: '',
};

const ACCOUNT_FIELDS: FormBuilderField<AccountFormValues>[] = [
  {
    type: 'text',
    name: 'firstName',
    label: 'First name',
    placeholder: 'First name',
    autoCapitalize: 'words',
    hideLabel: true,
    leadingIcon: <UserRound {...iconProps} />,
    rules: { required: requiredMessage('First name') },
  },
  {
    type: 'text',
    name: 'lastName',
    label: 'Last name',
    placeholder: 'Last name',
    autoCapitalize: 'words',
    hideLabel: true,
    leadingIcon: <UserRound {...iconProps} />,
    rules: { required: requiredMessage('Last name') },
  },
  {
    type: 'text',
    name: 'email',
    label: 'Owner email',
    placeholder: 'Owner email',
    keyboardType: 'email-address',
    hideLabel: true,
    leadingIcon: <Mail {...iconProps} />,
    rules: {
      required: requiredMessage('Owner email'),
      pattern: {
        value: EMAIL_PATTERN,
        message: 'Enter a valid email address.',
      },
    },
  },
  {
    type: 'phone',
    name: 'phone',
    label: 'Owner mobile number',
    placeholder: '7XXXXXXXX',
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

export function VendorSignupScreen({
  onAuthenticated,
  onNavigate,
  setNotice,
}: VendorSignupScreenProps): React.JSX.Element {
  const [busy, setBusy] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [sports, setSports] = useState<Sport[]>(SEEDED_SPORTS);
  const [accountValues, setAccountValues] = useState<AccountFormValues>(
    ACCOUNT_DEFAULT_VALUES,
  );
  const [businessValues, setBusinessValues] = useState<BusinessFormValues>(
    BUSINESS_DEFAULT_VALUES,
  );
  const [verificationContext, setVerificationContext] =
    useState<PhoneVerificationContext>();
  const [selectedDocument, setSelectedDocument] =
    useState<SelectedVerificationDocument>();
  const [selectedLogo, setSelectedLogo] = useState<SelectedVerificationDocument>();
  const [selectedFacilityImage, setSelectedFacilityImage] = useState<SelectedVerificationDocument>();
  const [selectingImage, setSelectingImage] = useState<'logo' | 'facility'>();
  const [imageError, setImageError] = useState<string>();
  const selectedFilesRef = useRef<SelectedVerificationDocument[]>([]);
  const [documentStatus, setDocumentStatus] = useState<
    'idle' | 'selecting' | 'ready' | 'uploading' | 'failed' | 'uploaded'
  >('idle');
  const [documentProgress, setDocumentProgress] = useState(0);
  const [documentError, setDocumentError] = useState<string>();
  const [pendingUpload, setPendingUpload] = useState<PendingVendorUpload>();
  const businessFormRef = useRef<UseFormReturn<BusinessFormValues> | null>(
    null,
  );

  useEffect(() => {
    selectedFilesRef.current = [selectedDocument, selectedLogo, selectedFacilityImage].filter(
      (file): file is SelectedVerificationDocument => Boolean(file),
    );
  }, [selectedDocument, selectedLogo, selectedFacilityImage]);

  useEffect(
    () => () => {
      Promise.all(selectedFilesRef.current.map(removeLocalDocument)).catch(() => undefined);
    },
    [],
  );

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

  const chooseDocument = async (onChange: (value: string) => void) => {
    if (pendingUpload) {
      return;
    }

    const previousDocument = selectedDocument;
    setDocumentError(undefined);
    setDocumentStatus('selecting');
    try {
      const nextDocument = await pickVerificationDocument();
      if (!nextDocument) {
        setDocumentStatus(previousDocument ? 'ready' : 'idle');
        return;
      }

      await removeLocalDocument(previousDocument);
      setSelectedDocument(nextDocument);
      onChange(nextDocument.name);
      setDocumentProgress(0);
      setDocumentStatus('ready');
    } catch (error) {
      setDocumentError(errorMessage(error));
      setDocumentStatus(previousDocument ? 'ready' : 'idle');
    }
  };

  const removeDocument = async (onChange: (value: string) => void) => {
    if (pendingUpload) {
      return;
    }

    const previousDocument = selectedDocument;
    setSelectedDocument(undefined);
    onChange('');
    setDocumentError(undefined);
    setDocumentProgress(0);
    setDocumentStatus('idle');
    await removeLocalDocument(previousDocument).catch(() => undefined);
  };

  const chooseBusinessImage = async (
    kind: 'logo' | 'facility',
    onChange: (value: string) => void,
  ) => {
    if (pendingUpload) {
      return;
    }
    const previous = kind === 'logo' ? selectedLogo : selectedFacilityImage;
    setSelectingImage(kind);
    setImageError(undefined);
    try {
      const next = await pickBusinessImage();
      if (!next) {
        return;
      }
      await removeLocalDocument(previous);
      if (kind === 'logo') {
        setSelectedLogo(next);
      } else {
        setSelectedFacilityImage(next);
      }
      onChange(next.name);
    } catch (error) {
      setImageError(errorMessage(error));
    } finally {
      setSelectingImage(undefined);
    }
  };

  const removeBusinessImage = async (
    kind: 'logo' | 'facility',
    onChange: (value: string) => void,
  ) => {
    const previous = kind === 'logo' ? selectedLogo : selectedFacilityImage;
    if (kind === 'logo') {
      setSelectedLogo(undefined);
    } else {
      setSelectedFacilityImage(undefined);
    }
    onChange('');
    setImageError(undefined);
    await removeLocalDocument(previous).catch(() => undefined);
  };

  const performUpload = async (upload: PendingVendorUpload) => {
    setDocumentError(undefined);
    setDocumentProgress(0);
    setDocumentStatus('uploading');
    try {
      for (let index = 0; index < upload.files.length; index += 1) {
        const file = upload.files[index];
        await uploadVerificationDocument(file.document, file.instructions, progress => {
          setDocumentProgress((index + progress) / upload.files.length);
        });
        await vendorApi.completeDocumentUpload(
          apiClient,
          upload.verificationContext.accessToken!,
          file.instructions.fileId,
        );
      }
      setDocumentStatus('uploaded');
      return true;
    } catch (error) {
      setDocumentError(
        `${errorMessage(error)} Check your connection and try again.`,
      );
      setDocumentStatus('failed');
      return false;
    }
  };

  const retryUpload = async () => {
    if (!pendingUpload || busy) {
      return;
    }

    setBusy(true);
    try {
      await performUpload(pendingUpload);
    } finally {
      setBusy(false);
    }
  };

  const businessFields: FormBuilderField<BusinessFormValues>[] = [
    {
      type: 'text',
      name: 'businessName',
      label: 'Business name',
      placeholder: 'Business name',
      autoCapitalize: 'words',
      hideLabel: true,
      leadingIcon: <Store {...iconProps} />,
      rules: { required: requiredMessage('Business name') },
    },
    {
      type: 'text',
      name: 'contactEmail',
      label: 'Business email',
      placeholder: 'Business email',
      keyboardType: 'email-address',
      hideLabel: true,
      leadingIcon: <Mail {...iconProps} />,
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
      placeholder: '7XXXXXXXX',
      rules: { validate: validatePhone },
    },
    {
      type: 'text',
      name: 'city',
      label: 'City',
      placeholder: 'City',
      autoCapitalize: 'words',
      hideLabel: true,
      leadingIcon: <MapPin {...iconProps} />,
      rules: { required: requiredMessage('City') },
    },
    {
      type: 'text',
      name: 'area',
      label: 'Area',
      placeholder: 'Area (optional)',
      autoCapitalize: 'words',
      hideLabel: true,
      leadingIcon: <Map {...iconProps} />,
    },
    {
      type: 'text',
      name: 'addressLine',
      label: 'Address',
      placeholder: 'Address',
      autoCapitalize: 'words',
      hideLabel: true,
      leadingIcon: <House {...iconProps} />,
      rules: { required: requiredMessage('Address') },
    },
    {
      type: 'custom',
      name: 'country',
      render: () => <CountryField />,
    },
    {
      type: 'custom',
      name: 'openingHours',
      rules: {validate: validateOpeningHours},
      render: ({field, fieldState}) => (
        <OpeningHoursField
          value={field.value as OpeningHoursValue}
          onChange={field.onChange}
          onBlur={field.onBlur}
          errorText={fieldState.error?.message}
        />
      ),
    },
    {
      type: 'chips',
      name: 'selectedSportIds',
      label: 'Sports offered',
      options: sports.map(sport => ({
        key: sport.id,
        label: sport.name,
        icon: sportIcon(sport.code),
      })),
      emptyText: 'No sports available',
      rules: {
        validate: value =>
          (Array.isArray(value) && value.length > 0) ||
          'Choose at least one sport.',
      },
    },
    {
      type: 'custom',
      name: 'logoName',
      rules: {required: requiredMessage('Business logo')},
      render: ({field, fieldState}) => (
        <BusinessImageField
          label="Business logo"
          help="Square JPEG or PNG, maximum 5 MB. Used on the facility profile after approval."
          document={selectedLogo}
          busy={selectingImage === 'logo' || Boolean(pendingUpload)}
          errorText={imageError ?? fieldState.error?.message}
          onPick={() => chooseBusinessImage('logo', field.onChange)}
          onRemove={() => removeBusinessImage('logo', field.onChange)}
        />
      ),
    },
    {
      type: 'custom',
      name: 'facilityImageName',
      rules: {required: requiredMessage('Facility image')},
      render: ({field, fieldState}) => (
        <BusinessImageField
          label="Facility image"
          help="A clear JPEG or PNG showing the venue, maximum 5 MB."
          document={selectedFacilityImage}
          busy={selectingImage === 'facility' || Boolean(pendingUpload)}
          errorText={imageError ?? fieldState.error?.message}
          onPick={() => chooseBusinessImage('facility', field.onChange)}
          onRemove={() => removeBusinessImage('facility', field.onChange)}
        />
      ),
    },
    {
      type: 'custom',
      name: 'documentName',
      rules: { required: requiredMessage('Verification document') },
      render: ({ field, fieldState }) => (
        <VerificationDocumentField
          document={selectedDocument}
          status={documentStatus}
          progress={documentProgress}
          locked={Boolean(pendingUpload)}
          errorText={documentError ?? fieldState.error?.message}
          onPick={() => chooseDocument(field.onChange)}
          onRemove={() => removeDocument(field.onChange)}
          onRetry={retryUpload}
        />
      ),
    },
  ];

  const continueToBusiness = (values: AccountFormValues) => {
    setAccountValues(values);
    setNotice({});
    setActiveStep(1);
  };

  const goBackToAccount = () => {
    const currentValues = businessFormRef.current?.getValues();
    if (currentValues) {
      setBusinessValues(currentValues);
    }
    setNotice({});
    setActiveStep(0);
  };

  const signupVendor = async (values: BusinessFormValues) => {
    setBusinessValues(values);

    if (pendingUpload) {
      if (documentStatus === 'uploaded') {
        setVerificationContext(pendingUpload.verificationContext);
        setActiveStep(2);
        await Promise.all(pendingUpload.files.map(file => removeLocalDocument(file.document))).catch(() => undefined);
        return;
      }

      await retryUpload();
      return;
    }

    if (!selectedDocument || !selectedLogo || !selectedFacilityImage) {
      setDocumentError('Choose the business license, logo, and facility image before continuing.');
      return;
    }

    setBusy(true);
    setNotice({});
    try {
      const ownerPhone = toE164(
        accountValues.phone.countryCode,
        accountValues.phone.nationalNumber,
      );
      const contactPhone = toE164(
        values.phone.countryCode,
        values.phone.nationalNumber,
      );
      const selectedSportNames = sports
        .filter(sport => values.selectedSportIds.includes(sport.id))
        .map(sport => sport.name);
      const response = await vendorApi.signup(apiClient, {
        firstName: accountValues.firstName,
        lastName: accountValues.lastName,
        email: accountValues.email,
        phoneE164: ownerPhone,
        password: accountValues.password,
        deviceLabel: 'Sports Lobby mobile',
        businessName: values.businessName,
        contactPhone,
        contactEmail: values.contactEmail,
        countryCode: 'JO',
        city: values.city,
        area: values.area,
        addressLine: values.addressLine,
        supportedSports: selectedSportNames.join(', '),
        venueCountEstimate: 1,
        openingHours: serializeOpeningHours(values.openingHours),
        verificationDocuments: [
          {
            documentType: 'BUSINESS_LICENSE',
            fileName: selectedDocument.name,
            contentType: selectedDocument.contentType,
            sizeBytes: selectedDocument.sizeBytes,
          },
          {
            documentType: 'BUSINESS_LOGO',
            fileName: selectedLogo.name,
            contentType: selectedLogo.contentType,
            sizeBytes: selectedLogo.sizeBytes,
          },
          {
            documentType: 'FACILITY_PHOTO',
            fileName: selectedFacilityImage.name,
            contentType: selectedFacilityImage.contentType,
            sizeBytes: selectedFacilityImage.sizeBytes,
          },
        ],
        acceptedTerms: accountValues.acceptedTerms,
        acceptedPrivacy: accountValues.acceptedPrivacy,
      });

      const nextUpload: PendingVendorUpload = {
        files: [selectedDocument, selectedLogo, selectedFacilityImage].map((document, index) => ({
          document,
          instructions: response.documentUploads[index],
        })),
        verificationContext: {
          phoneE164: response.user.phoneE164,
          password: accountValues.password,
          title: 'Vendor application submitted',
          otpAlreadySent: true,
          accessToken: response.tokens.accessToken,
          pendingSession: toSession(response),
        },
      };

      if (nextUpload.files.some(file => !file.instructions)) {
        throw new Error(
          'The server did not return document upload instructions.',
        );
      }

      setPendingUpload(nextUpload);
      await performUpload(nextUpload);
    } catch (error) {
      if (pendingUpload) {
        setDocumentError(errorMessage(error));
        setDocumentStatus('failed');
      } else {
        showError(error, setNotice);
      }
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
          <Heading
            title="Create owner account"
            subtitle="Set up the private login for the person who will manage this business."
          />
          <FormBuilder
            fields={ACCOUNT_FIELDS}
            defaultValues={accountValues}
            onSubmit={continueToBusiness}
            submitLabel="Continue"
            appearance="auth"
            submitVariant="brand"
            submitSize="large"
            beforeSubmit={
              <InfoBanner
                icon={<Info color={colors.brand} size={28} strokeWidth={2} />}
                message="Use the owner's private email and mobile. The mobile is used for sign-in, verification, and recovery; neither replaces the facility contacts on the next step."
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
      key: 'business',
      label: 'Business',
      content: (
        <View style={styles.stepScreen}>
          <Heading
            title="Business Information"
            subtitle="Add the email and phone customers should use to contact your facility. These can differ from the owner's login details."
          />
          <FormBuilder
            fields={businessFields}
            defaultValues={businessValues}
            onSubmit={signupVendor}
            submitLabel={
              documentStatus === 'uploaded'
                ? 'Continue to verification'
                : pendingUpload
                  ? 'Retry upload'
                  : 'Submit application'
            }
            busy={busy}
            appearance="auth"
            submitVariant="brand"
            submitSize="large"
            formRef={businessFormRef}
            beforeSubmit={
              <InfoBanner
                icon={<Info color={colors.brand} size={28} strokeWidth={2} />}
                message="Business contact details belong to the facility and may be shown to customers."
              />
            }
            footer={
              <AppButton
                label="Back"
                onPress={goBackToAccount}
                disabled={Boolean(pendingUpload)}
                variant="ghost"
                size="large"
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
          subtitle="We sent a verification code to the owner's mobile number."
          phoneLabel="Owner mobile number"
          securityMessage="Verifying the owner's mobile helps secure your vendor account."
        />
      ) : null,
    },
  ];

  return (
    <View style={styles.screen}>
      <AuthBrand />
      <Stepper
        steps={steps}
        activeStep={activeStep}
        allowCompletedStepNavigation={activeStep === 1 && !pendingUpload}
        onStepPress={stepIndex => {
          if (stepIndex === 0) {
            goBackToAccount();
          }
        }}
      />
    </View>
  );
}

type HeadingProps = {
  title: string;
  subtitle: string;
};

function Heading({ title, subtitle }: HeadingProps): React.JSX.Element {
  return (
    <View style={styles.heading}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

function CountryField(): React.JSX.Element {
  return (
    <View style={styles.countryField} accessibilityLabel="Country, Jordan">
      <Globe {...iconProps} />
      <View>
        <Text style={styles.countryLabel}>Country</Text>
        <Text style={styles.countryValue}>Jordan</Text>
      </View>
    </View>
  );
}

function sportIcon(code: string): React.JSX.Element {
  switch (code.toUpperCase()) {
    case 'VOLLEYBALL':
      return <Volleyball {...sportIconProps} />;
    case 'PADEL':
    case 'BADMINTON':
      return <Activity {...sportIconProps} />;
    default:
      return <CircleDot {...sportIconProps} />;
  }
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
  countryField: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 56,
    paddingHorizontal: spacing.lg,
  },
  countryLabel: {
    ...typography.caption,
    color: colors.muted,
  },
  countryValue: {
    ...typography.body,
    color: colors.text,
  },
});

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Document upload failed.';
}
