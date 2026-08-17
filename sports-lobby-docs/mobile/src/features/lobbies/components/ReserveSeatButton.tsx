import React from 'react';
import {ActivityIndicator, Pressable, StyleSheet, Text, View} from 'react-native';
import {Armchair} from 'lucide-react-native';
import {colors, radii, spacing, typography} from '../../../theme/tokens';

type ReserveSeatButtonProps = {
  label: string;
  priceLabel: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export function ReserveSeatButton({
  label,
  priceLabel,
  onPress,
  disabled = false,
  loading = false,
}: ReserveSeatButtonProps): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{busy: loading, disabled: disabled || loading}}
      disabled={disabled || loading}
      onPress={onPress}
      style={({pressed}) => [
        styles.button,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
      ]}>
      {loading ? (
        <ActivityIndicator color={colors.surface} size="small" />
      ) : (
        <Armchair color={colors.surface} size={26} />
      )}
      <View style={styles.copy}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.price}>{priceLabel}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.brand,
    borderRadius: radii.lg,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'center',
    minHeight: 66,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  copy: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  label: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
  price: {
    ...typography.caption,
    color: colors.surface,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.75,
  },
});
