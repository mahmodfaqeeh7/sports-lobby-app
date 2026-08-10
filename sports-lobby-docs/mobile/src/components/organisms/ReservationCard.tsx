import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {AppButton} from '../atoms/AppButton';
import {Badge} from '../atoms/Badge';
import {colors, radii, spacing, typography} from '../../theme/tokens';
import {Reservation} from '../../features/reservations/api';

type ReservationCardProps = {
  reservation: Reservation;
  onCancel?: () => void;
  disabled?: boolean;
};

export function ReservationCard({reservation, onCancel, disabled}: ReservationCardProps): React.JSX.Element {
  const active = reservation.status === 'RESERVED' || reservation.status === 'CONFIRMED';
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.copy}>
          <Text style={styles.title}>{reservation.currencyCodeSnapshot} {reservation.unitPriceSnapshot}</Text>
          <Text style={styles.meta}>Lobby {reservation.lobbyId.slice(0, 8)} - {formatDate(reservation.reservedAt)}</Text>
        </View>
        <Badge label={reservation.status} tone={active ? 'success' : 'neutral'} />
      </View>
      {onCancel ? <AppButton label="Cancel reservation" onPress={onCancel} disabled={disabled || !active} variant="danger" /> : null}
    </View>
  );
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString(undefined, {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'});
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.md,
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
});
