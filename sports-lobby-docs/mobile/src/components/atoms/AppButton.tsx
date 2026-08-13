import React, { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { colors, radii, spacing, typography } from '../../theme/tokens';

export type AppButtonVariant =
  'primary' | 'brand' | 'secondary' | 'brandOutline' | 'danger' | 'ghost';
export type AppButtonSize = 'default' | 'large';

type AppButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  style?: ViewStyle;
  icon?: ReactNode;
};

export function AppButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'default',
  style,
  icon,
}: AppButtonProps): React.JSX.Element {
  const lightContent = variant === 'primary' || variant === 'brand';
  const loadingColor = lightContent
    ? colors.surface
    : variant === 'brandOutline'
      ? colors.brand
      : colors.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: disabled || loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        size === 'large' && styles.large,
        (disabled || loading) && styles.disabled,
        pressed && !disabled && !loading && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={loadingColor} />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.label,
              !lightContent && styles.darkLabel,
              variant === 'brandOutline' && styles.brandOutlineLabel,
              size === 'large' && styles.largeLabel,
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  primary: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  brand: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  brandOutline: {
    backgroundColor: colors.surface,
    borderColor: colors.brand,
  },
  danger: {
    backgroundColor: colors.surface,
    borderColor: colors.danger,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.72,
  },
  large: {
    borderRadius: radii.lg,
    minHeight: 54,
  },
  label: {
    ...typography.button,
    color: colors.surface,
  },
  darkLabel: {
    color: colors.text,
  },
  brandOutlineLabel: {
    color: colors.brand,
  },
  largeLabel: {
    fontSize: 17,
    lineHeight: 22,
  },
});
