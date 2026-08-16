import React, { ReactNode, useState } from 'react';
import {
  KeyboardTypeOptions,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
} from 'react-native';
import { colors, radii, spacing, typography } from '../../theme/tokens';

export type FieldAppearance = 'default' | 'auth';

export type AppTextFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  errorText?: string;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  maxLength?: number;
  onBlur?: () => void;
  appearance?: FieldAppearance;
  showLabel?: boolean;
  leadingIcon?: ReactNode;
  trailingAccessory?: ReactNode;
  inputStyle?: StyleProp<TextStyle>;
};

export function AppTextField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  multiline = false,
  errorText,
  autoCapitalize = 'none',
  maxLength,
  onBlur,
  appearance = 'default',
  showLabel = true,
  leadingIcon,
  trailingAccessory,
  inputStyle,
}: AppTextFieldProps): React.JSX.Element {
  const [focused, setFocused] = useState(false);
  const authAppearance = appearance === 'auth';

  return (
    <View style={styles.wrap}>
      {showLabel ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.inputRow,
          authAppearance && styles.authInputRow,
          focused && styles.focused,
          errorText && styles.inputError,
        ]}
      >
        {leadingIcon}
        <TextInput
          accessibilityLabel={showLabel ? undefined : label}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          maxLength={maxLength}
          multiline={multiline}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          placeholder={placeholder}
          placeholderTextColor={colors.subtle}
          secureTextEntry={secureTextEntry}
          style={[
            styles.input,
            multiline && styles.multiline,
            authAppearance && styles.authInput,
            inputStyle,
          ]}
          value={value}
        />
        {trailingAccessory}
      </View>
      {errorText ? <Text style={styles.error}>{errorText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  label: {
    ...typography.caption,
    color: colors.muted,
  },
  inputRow: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
  },
  authInputRow: {
    alignItems: 'center',
    borderRadius: radii.lg,
    minHeight: 56,
    paddingHorizontal: spacing.lg,
  },
  focused: {
    borderColor: colors.brand,
  },
  input: {
    color: colors.text,
    flex: 1,
    minHeight: 46,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  authInput: {
    fontSize: 16,
    minHeight: 54,
  },
  multiline: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
  },
});
