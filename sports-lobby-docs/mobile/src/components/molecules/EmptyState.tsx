import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors, spacing, typography} from '../../theme/tokens';

type EmptyStateProps = {
  title: string;
  message: string;
};

export function EmptyState({title, message}: EmptyStateProps): React.JSX.Element {
  return (
    <View style={styles.empty}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    gap: spacing.xs,
    paddingVertical: spacing.md,
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
