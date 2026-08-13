import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, spacing, typography } from '../../../theme/tokens';

type AuthPromptLinkProps = {
  prompt: string;
  action: string;
  onPress: () => void;
  icon?: ReactNode;
};

export function AuthPromptLink({
  prompt,
  action,
  onPress,
  icon,
}: AuthPromptLinkProps): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={styles.pressable}
    >
      {icon}
      <Text style={styles.prompt}>
        {prompt}
        <Text style={styles.action}>{action}</Text>
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.sm,
  },
  prompt: {
    ...typography.body,
    color: colors.muted,
    textAlign: 'center',
  },
  action: {
    color: colors.brand,
    fontWeight: '500',
  },
});
