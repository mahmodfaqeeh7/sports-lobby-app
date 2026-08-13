import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Volleyball from 'lucide-react-native/icons/volleyball';
import { brand } from '../../../config/brand';
import { colors, spacing } from '../../../theme/tokens';

export function AuthBrand(): React.JSX.Element {
  return (
    <View
      style={styles.wrap}
      accessibilityLabel={`${brand.nameLead}${brand.nameAccent}. ${brand.tagline}`}
    >
      <View style={styles.mark}>
        <Text style={styles.markLetter}>P</Text>
        <View style={styles.ball}>
          <Volleyball color={colors.brand} size={16} strokeWidth={2} />
        </View>
      </View>
      <View style={styles.wordmark}>
        <Text style={styles.wordLead}>{brand.nameLead}</Text>
        <Text style={styles.wordAccent}>{brand.nameAccent}</Text>
      </View>
      <Text style={styles.tagline}>{brand.tagline}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  mark: {
    height: 50,
    justifyContent: 'center',
    width: 64,
  },
  markLetter: {
    color: colors.brand,
    fontSize: 60,
    fontStyle: 'italic',
    fontWeight: '900',
    lineHeight: 64,
    position: 'absolute',
    top: -7,
  },
  ball: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    position: 'absolute',
    right: 24,
    top: 16,
    width: 24,
  },
  wordmark: {
    flexDirection: 'row',
  },
  wordLead: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 33,
  },
  wordAccent: {
    color: colors.brand,
    fontSize: 28,
    fontWeight: '500',
    lineHeight: 33,
  },
  tagline: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
});
