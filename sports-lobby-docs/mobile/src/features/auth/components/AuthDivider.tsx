import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../../theme/tokens';

type AuthDividerProps = {
  label: string;
};

export function AuthDivider({ label }: AuthDividerProps): React.JSX.Element {
  return (
    <View style={styles.row}>
      <View style={styles.line} />
      <Text style={styles.label}>{label}</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.lg,
  },
  line: {
    backgroundColor: colors.divider,
    flex: 1,
    height: 1,
  },
  label: {
    ...typography.body,
    color: colors.muted,
  },
});
