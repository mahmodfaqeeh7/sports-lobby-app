import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {AppButton} from '../atoms/AppButton';
import {Badge} from '../atoms/Badge';
import {colors, radii, spacing, typography} from '../../theme/tokens';
import {Lobby} from '../../features/lobbies/api';

type LobbyCardProps = {
  lobby: Lobby;
  sportName?: string;
  actionLabel?: string;
  onAction?: () => void;
  disabled?: boolean;
};

export function LobbyCard({lobby, sportName, actionLabel, onAction, disabled}: LobbyCardProps): React.JSX.Element {
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.copy}>
          <Text style={styles.title}>{sportName ?? 'Sport lobby'}</Text>
          <Text style={styles.meta}>{formatDate(lobby.startsAt)} - {formatTime(lobby.endsAt)}</Text>
        </View>
        <Badge label={lobby.status} tone={lobby.status === 'OPEN' ? 'success' : 'neutral'} />
      </View>
      <View style={styles.metrics}>
        <Metric label="Players" value={`${lobby.reservedPlayers}/${lobby.maxPlayers}`} />
        <Metric label="Available" value={String(lobby.availableSeats)} />
        <Metric label="Price" value={`${lobby.pricePerSeat} ${lobby.currencyCode}`} />
      </View>
      {lobby.description ? <Text style={styles.description}>{lobby.description}</Text> : null}
      {actionLabel && onAction ? <AppButton label={actionLabel} onPress={onAction} disabled={disabled} /> : null}
    </View>
  );
}

function Metric({label, value}: {label: string; value: string}): React.JSX.Element {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString(undefined, {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'});
}

function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString(undefined, {hour: '2-digit', minute: '2-digit'});
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
  top: {
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
  metrics: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metric: {
    backgroundColor: colors.background,
    borderRadius: radii.sm,
    flex: 1,
    gap: spacing.xs,
    padding: spacing.sm,
  },
  metricLabel: {
    ...typography.caption,
    color: colors.muted,
  },
  metricValue: {
    ...typography.button,
    color: colors.text,
  },
  description: {
    ...typography.caption,
    color: colors.muted,
  },
});
