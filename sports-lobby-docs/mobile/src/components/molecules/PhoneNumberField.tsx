import React, {useMemo, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import {colors, radii, spacing, typography} from '../../theme/tokens';

export type CallingCode = {
  country: string;
  iso: string;
  code: string;
};

export const callingCodes: CallingCode[] = [
  {country: 'Jordan', iso: 'JO', code: '+962'},
  {country: 'Saudi Arabia', iso: 'SA', code: '+966'},
  {country: 'United Arab Emirates', iso: 'AE', code: '+971'},
  {country: 'Qatar', iso: 'QA', code: '+974'},
  {country: 'Kuwait', iso: 'KW', code: '+965'},
  {country: 'Bahrain', iso: 'BH', code: '+973'},
  {country: 'Oman', iso: 'OM', code: '+968'},
  {country: 'Palestine', iso: 'PS', code: '+970'},
  {country: 'Lebanon', iso: 'LB', code: '+961'},
  {country: 'Syria', iso: 'SY', code: '+963'},
  {country: 'Iraq', iso: 'IQ', code: '+964'},
  {country: 'Egypt', iso: 'EG', code: '+20'},
  {country: 'Turkey', iso: 'TR', code: '+90'},
  {country: 'United States', iso: 'US', code: '+1'},
  {country: 'Canada', iso: 'CA', code: '+1'},
  {country: 'United Kingdom', iso: 'GB', code: '+44'},
  {country: 'Germany', iso: 'DE', code: '+49'},
  {country: 'France', iso: 'FR', code: '+33'},
  {country: 'Spain', iso: 'ES', code: '+34'},
  {country: 'Italy', iso: 'IT', code: '+39'},
  {country: 'Netherlands', iso: 'NL', code: '+31'},
  {country: 'Sweden', iso: 'SE', code: '+46'},
  {country: 'Norway', iso: 'NO', code: '+47'},
  {country: 'Denmark', iso: 'DK', code: '+45'},
  {country: 'Australia', iso: 'AU', code: '+61'},
  {country: 'India', iso: 'IN', code: '+91'},
  {country: 'Pakistan', iso: 'PK', code: '+92'},
  {country: 'Philippines', iso: 'PH', code: '+63'},
  {country: 'Indonesia', iso: 'ID', code: '+62'},
  {country: 'Malaysia', iso: 'MY', code: '+60'},
  {country: 'China', iso: 'CN', code: '+86'},
  {country: 'Japan', iso: 'JP', code: '+81'},
  {country: 'South Korea', iso: 'KR', code: '+82'},
  {country: 'Brazil', iso: 'BR', code: '+55'},
  {country: 'Mexico', iso: 'MX', code: '+52'},
  {country: 'South Africa', iso: 'ZA', code: '+27'},
  {country: 'Morocco', iso: 'MA', code: '+212'},
  {country: 'Tunisia', iso: 'TN', code: '+216'},
  {country: 'Algeria', iso: 'DZ', code: '+213'},
].sort((a, b) => a.country.localeCompare(b.country));

type PhoneNumberFieldProps = {
  label: string;
  countryCode: string;
  onChangeCountryCode: (value: string) => void;
  nationalNumber: string;
  onChangeNationalNumber: (value: string) => void;
};

export function PhoneNumberField({
  label,
  countryCode,
  onChangeCountryCode,
  nationalNumber,
  onChangeNationalNumber,
}: PhoneNumberFieldProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const selected = useMemo(
    () => callingCodes.find(item => item.code === countryCode) ?? callingCodes[0],
    [countryCode],
  );

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <Pressable accessibilityRole="button" onPress={() => setOpen(current => !current)} style={styles.prefix}>
          <Text style={styles.prefixCountry}>{selected.iso}</Text>
          <Text style={styles.prefixCode}>{selected.code}</Text>
        </Pressable>
        <TextInput
          keyboardType="phone-pad"
          onChangeText={value => onChangeNationalNumber(value.replace(/[^0-9]/g, ''))}
          placeholder="790000000"
          placeholderTextColor={colors.subtle}
          style={styles.input}
          value={nationalNumber}
        />
      </View>
      {open ? (
        <ScrollView style={styles.menu} nestedScrollEnabled keyboardShouldPersistTaps="handled">
          {callingCodes.map(item => (
            <Pressable
              key={`${item.iso}-${item.code}`}
              onPress={() => {
                onChangeCountryCode(item.code);
                setOpen(false);
              }}
              style={[styles.option, item.code === countryCode && styles.selectedOption]}>
              <Text style={styles.optionCountry}>{item.country}</Text>
              <Text style={styles.optionCode}>{item.code}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

export function toE164(countryCode: string, nationalNumber: string): string {
  const digits = nationalNumber.replace(/[^0-9]/g, '').replace(/^0+/, '');
  return `${countryCode}${digits}`;
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  label: {
    ...typography.caption,
    color: colors.muted,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  prefix: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: spacing.md,
    width: 104,
  },
  prefixCountry: {
    ...typography.caption,
    color: colors.muted,
  },
  prefixCode: {
    ...typography.button,
    color: colors.text,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    flex: 1,
    minHeight: 46,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  menu: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    maxHeight: 220,
  },
  option: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  selectedOption: {
    backgroundColor: '#ECFDF3',
  },
  optionCountry: {
    ...typography.caption,
    color: colors.text,
  },
  optionCode: {
    ...typography.button,
    color: colors.muted,
  },
});
