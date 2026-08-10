import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors, radii, spacing, typography} from '../../theme/tokens';

type BadgeProps = {
  label: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
};

export function Badge({label, tone = 'neutral'}: BadgeProps): React.JSX.Element {
  return (
    <View style={[styles.badge, styles[tone]]}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radii.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  neutral: {
    backgroundColor: '#EEF2F7',
    borderColor: colors.border,
  },
  success: {
    backgroundColor: '#ECFDF3',
    borderColor: colors.accent,
  },
  warning: {
    backgroundColor: '#FFF7E6',
    borderColor: '#D97706',
  },
  danger: {
    backgroundColor: '#FFF1F0',
    borderColor: colors.danger,
  },
  label: {
    ...typography.caption,
    color: colors.text,
  },
});
