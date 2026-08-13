import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Eye from 'lucide-react-native/icons/eye';
import EyeOff from 'lucide-react-native/icons/eye-off';
import LockKeyhole from 'lucide-react-native/icons/lock-keyhole';
import { FieldAppearance } from '../atoms/AppTextField';
import { colors, radii, spacing, typography } from '../../theme/tokens';

type PasswordFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  errorText?: string;
  onBlur?: () => void;
  appearance?: FieldAppearance;
  showLabel?: boolean;
};

export function PasswordField({
  label,
  value,
  onChangeText,
  placeholder,
  errorText,
  onBlur,
  appearance = 'default',
  showLabel = true,
}: PasswordFieldProps): React.JSX.Element {
  const [visible, setVisible] = useState(false);
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
        {authAppearance ? (
          <LockKeyhole color={colors.icon} size={22} strokeWidth={1.8} />
        ) : null}
        <TextInput
          accessibilityLabel={showLabel ? undefined : label}
          autoCapitalize="none"
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          placeholder={placeholder}
          placeholderTextColor={colors.subtle}
          secureTextEntry={!visible}
          style={[styles.input, authAppearance && styles.authInput]}
          value={value}
        />
        <Pressable
          accessibilityLabel={visible ? 'Hide password' : 'Show password'}
          accessibilityRole="button"
          onPress={() => setVisible(current => !current)}
          style={styles.toggle}
        >
          {visible ? (
            <EyeOff color={colors.icon} size={24} strokeWidth={1.8} />
          ) : (
            <Eye color={colors.icon} size={24} strokeWidth={1.8} />
          )}
        </Pressable>
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
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 46,
  },
  authInputRow: {
    borderRadius: radii.lg,
    minHeight: 56,
    paddingLeft: spacing.lg,
  },
  focused: {
    borderColor: colors.brand,
  },
  inputError: {
    borderColor: colors.danger,
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
  toggle: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 48,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
  },
});
