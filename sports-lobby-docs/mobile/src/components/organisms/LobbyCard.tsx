import React from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';
import {CalendarDays, Clock3, MapPin, Timer, UsersRound} from 'lucide-react-native';
import {AppButton} from '../atoms/AppButton';
import {Badge} from '../atoms/Badge';
import {colors, radii, spacing, typography} from '../../theme/tokens';
import {Lobby} from '../../features/lobbies/api';
import {reachableBackendUrl} from '../../config/environment';

type LobbyCardProps = {
  lobby: Lobby;
  sportName?: string;
  actionLabel?: string;
  onAction?: () => void;
  disabled?: boolean;
};

export function LobbyCard({
  lobby,
  sportName,
  actionLabel,
  onAction,
  disabled,
}: LobbyCardProps): React.JSX.Element {
  const full = lobby.availableSeats <= 0 || lobby.status === 'FULL';
  const resolvedSportName = lobby.sportName || sportName || 'Sport lobby';

  return (
    <View style={styles.card}>
      {lobby.courtImageUrl ? (
        <Image
          accessibilityLabel={`${lobby.courtName || resolvedSportName} court`}
          source={{uri: reachableBackendUrl(lobby.courtImageUrl)}}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.imageFallback}>
          <Text style={styles.imageFallbackText}>{resolvedSportName}</Text>
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.top}>
          <View style={styles.copy}>
            <Text style={styles.title}>{resolvedSportName}</Text>
            <View style={styles.inlineMeta}>
              <MapPin color={colors.accent} size={17} />
              <Text style={styles.venue} numberOfLines={1}>
                {lobby.venueName || lobby.courtName || 'Sports venue'}
              </Text>
            </View>
            {lobby.venueArea || lobby.venueCity ? (
              <Text style={styles.location} numberOfLines={1}>
                {[lobby.venueArea, lobby.venueCity].filter(Boolean).join(', ')}
              </Text>
            ) : null}
          </View>
          <Badge label={full ? 'FULL' : lobby.status} tone={full ? 'neutral' : 'success'} />
        </View>

        <View style={styles.schedule}>
          <ScheduleItem icon={<CalendarDays color={colors.brand} size={18} />} value={formatDate(lobby.startsAt)} />
          <ScheduleItem icon={<Clock3 color={colors.icon} size={18} />} value={formatTime(lobby.startsAt)} />
          <ScheduleItem icon={<Timer color={colors.brand} size={18} />} value={`${durationMinutes(lobby)} min`} />
        </View>

        <View style={styles.divider} />
        <View style={styles.metrics}>
          <Metric label="Seats left" value={`${lobby.availableSeats} / ${lobby.maxPlayers}`} />
          <View style={styles.metricDivider} />
          <Metric label="Players" value={`${lobby.minPlayers} - ${lobby.maxPlayers}`} />
          <View style={styles.metricDivider} />
          <Metric label="Reserved" value={String(lobby.reservedPlayers)} icon={<UsersRound color={colors.accent} size={17} />} />
          <View style={styles.metricDivider} />
          <Metric label="per player" value={`${formatPrice(lobby.pricePerSeat)} ${lobby.currencyCode}`} accent />
        </View>

        {lobby.description ? <Text style={styles.description}>{lobby.description}</Text> : null}
        {actionLabel && onAction ? (
          <AppButton
            label={full ? 'Lobby full' : actionLabel}
            onPress={onAction}
            disabled={disabled || full}
            variant={full ? 'secondary' : 'brand'}
            size="large"
          />
        ) : null}
      </View>
    </View>
  );
}

function ScheduleItem({icon, value}: {icon: React.ReactNode; value: string}): React.JSX.Element {
  return <View style={styles.scheduleItem}>{icon}<Text style={styles.scheduleText}>{value}</Text></View>;
}

function Metric({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: string;
  accent?: boolean;
  icon?: React.ReactNode;
}): React.JSX.Element {
  return (
    <View style={styles.metric}>
      <View style={styles.metricValueRow}>{icon}<Text style={[styles.metricValue, accent && styles.metricAccent]}>{value}</Text></View>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {weekday: 'short', month: 'short', day: 'numeric'});
}

function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString(undefined, {hour: 'numeric', minute: '2-digit'});
}

function durationMinutes(lobby: Lobby): number {
  return Math.max(1, Math.round((new Date(lobby.endsAt).getTime() - new Date(lobby.startsAt).getTime()) / 60000));
}

function formatPrice(value: number): string {
  return Number(value).toLocaleString(undefined, {maximumFractionDigits: 2});
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  image: {aspectRatio: 16 / 8, width: '100%'},
  imageFallback: {
    alignItems: 'center',
    aspectRatio: 16 / 7,
    backgroundColor: colors.brandSoft,
    justifyContent: 'center',
    width: '100%',
  },
  imageFallbackText: {...typography.sectionTitle, color: colors.brand},
  body: {gap: spacing.md, padding: spacing.lg},
  top: {alignItems: 'flex-start', flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between'},
  copy: {flex: 1, gap: spacing.xs},
  title: {...typography.sectionTitle, color: colors.ink},
  inlineMeta: {alignItems: 'center', flexDirection: 'row', gap: spacing.xs},
  venue: {...typography.body, color: colors.text, flex: 1},
  location: {...typography.caption, color: colors.muted, marginLeft: 21},
  schedule: {alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg},
  scheduleItem: {alignItems: 'center', flexDirection: 'row', gap: spacing.xs},
  scheduleText: {...typography.caption, color: colors.text},
  divider: {backgroundColor: colors.divider, height: 1},
  metrics: {alignItems: 'stretch', flexDirection: 'row'},
  metric: {alignItems: 'center', flex: 1, gap: spacing.xs, justifyContent: 'center'},
  metricDivider: {backgroundColor: colors.divider, width: 1},
  metricValueRow: {alignItems: 'center', flexDirection: 'row', gap: spacing.xs},
  metricLabel: {...typography.caption, color: colors.muted, fontSize: 11},
  metricValue: {...typography.button, color: colors.text, textAlign: 'center'},
  metricAccent: {color: colors.brand},
  description: {...typography.caption, color: colors.muted},
});
