import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radii, spacing, typography } from '../../../theme/tokens';

type SocialAuthButtonProps = {
  label: string;
  icon: ReactNode;
  onPress: () => void;
};

export function SocialAuthButton({
  label,
  icon,
  onPress,
}: SocialAuthButtonProps): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      {icon}
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.lg,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: spacing.lg,
  },
  pressed: {
    backgroundColor: colors.background,
  },
  label: {
    ...typography.body,
    color: colors.ink,
    fontWeight: '500',
  },
});
