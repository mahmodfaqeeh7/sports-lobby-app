import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {Badge} from '../atoms/Badge';
import {colors, radii, spacing, typography} from '../../theme/tokens';
import {Venue} from '../../features/venues/api';

type VenueCardProps = {
  venue: Venue;
};

export function VenueCard({venue}: VenueCardProps): React.JSX.Element {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.copy}>
          <Text style={styles.title}>{venue.name}</Text>
          <Text style={styles.meta}>{venue.city}{venue.area ? `, ${venue.area}` : ''}</Text>
        </View>
        <Badge label={venue.status} tone={venue.status === 'ACTIVE' ? 'success' : 'neutral'} />
      </View>
      <Text style={styles.address}>{venue.addressLine}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.text,
  },
  meta: {
    ...typography.caption,
    color: colors.muted,
  },
  address: {
    ...typography.caption,
    color: colors.text,
  },
});
