import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors, spacing, typography} from '../../theme/tokens';

type EmptyStateProps = {
  title: string;
  message: string;
  alignment?: 'start' | 'center';
};

export function EmptyState({
  title,
  message,
  alignment = 'start',
}: EmptyStateProps): React.JSX.Element {
  const centered = alignment === 'center';

  return (
    <View style={[styles.empty, centered && styles.centered]}>
      <Text style={[styles.title, centered && styles.centeredText]}>{title}</Text>
      <Text style={[styles.message, centered && styles.centeredText]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  centered: {
    alignItems: 'center',
  },
  centeredText: {
    textAlign: 'center',
  },
  title: {
    ...typography.button,
    color: colors.text,
  },
  message: {
    ...typography.caption,
    color: colors.muted,
  },
});
