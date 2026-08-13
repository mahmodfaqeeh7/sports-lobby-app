import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import { colors, radii, spacing, typography } from '../../../theme/tokens';

export type AuthActionLink = {
  key: string;
  icon: ReactNode;
  lead?: string;
  action: string;
  onPress: () => void;
};

type AuthActionLinksProps = {
  items: AuthActionLink[];
};

export function AuthActionLinks({
  items,
}: AuthActionLinksProps): React.JSX.Element {
  return (
    <View style={styles.list}>
      {items.map(item => (
        <Pressable
          accessibilityRole="button"
          key={item.key}
          onPress={item.onPress}
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        >
          <View style={styles.iconCircle}>{item.icon}</View>
          <Text
            style={styles.copy}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.72}
          >
            {item.lead ? <Text style={styles.lead}>{item.lead}</Text> : null}
            <Text style={styles.action}>{item.action}</Text>
          </Text>
          <ChevronRight color={colors.brand} size={24} strokeWidth={2} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.xs,
  },
  row: {
    alignItems: 'center',
    borderRadius: radii.md,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 50,
    paddingHorizontal: spacing.xs,
  },
  pressed: {
    backgroundColor: colors.brandSoft,
  },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: colors.brandSoft,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  copy: {
    ...typography.body,
    color: colors.ink,
    flex: 1,
  },
  lead: {
    color: colors.ink,
  },
  action: {
    color: colors.brand,
    fontWeight: '500',
  },
});
