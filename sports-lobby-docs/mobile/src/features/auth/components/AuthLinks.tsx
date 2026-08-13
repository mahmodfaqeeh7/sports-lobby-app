import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {colors, spacing, typography} from '../../../theme/tokens';

export type AuthLink = {
  text: string;
  onPress: () => void;
};

type AuthLinksProps = {
  items: AuthLink[];
};

export function AuthLinks({items}: AuthLinksProps): React.JSX.Element {
  return (
    <View style={styles.links}>
      {items.map(item => (
        <Pressable accessibilityRole="button" key={item.text} onPress={item.onPress} style={styles.linkWrap}>
          <Text style={styles.linkText}>{item.text}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  links: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  linkWrap: {
    minHeight: 32,
    justifyContent: 'center',
  },
  linkText: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '700',
    textAlign: 'center',
  },
});
