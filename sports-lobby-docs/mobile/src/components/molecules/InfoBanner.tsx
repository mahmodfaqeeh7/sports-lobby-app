import React, { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../../theme/tokens';

type InfoBannerProps = {
  title?: string;
  message: string;
  icon?: ReactNode;
};

export function InfoBanner({
  title,
  message,
  icon,
}: InfoBannerProps): React.JSX.Element {
  return (
    <View style={styles.banner}>
      {icon}
      <View style={styles.copy}>
        {title ? <Text style={styles.title}>{title}</Text> : null}
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    alignItems: 'center',
    backgroundColor: colors.brandSoft,
    borderColor: colors.brandBorder,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.lg,
    minHeight: 72,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  message: {
    ...typography.body,
    color: colors.text,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...typography.button,
    color: colors.text,
  },
});
