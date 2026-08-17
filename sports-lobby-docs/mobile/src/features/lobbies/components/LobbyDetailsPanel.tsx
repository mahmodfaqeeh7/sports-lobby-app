import React from 'react';
import {
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, {Marker} from 'react-native-maps';
import {
  CalendarDays,
  CircleDollarSign,
  Clock3,
  FileText,
  LayoutGrid,
  MapPin,
  MessageCircle,
  Phone,
  TimerReset,
  UsersRound,
  XCircle,
} from 'lucide-react-native';
import {colors, radii, spacing, typography} from '../../../theme/tokens';
import {Lobby} from '../api';
import {
  formatDeadlineLeadTime,
  formatLobbyDate,
  formatLobbyDeadline,
  formatLobbyPrice,
  formatLobbyTimeRange,
  pricingModelLabel,
  venueAddress,
} from '../utils/lobbyFormatting';

type LobbyDetailsPanelProps = {
  lobby: Lobby;
};

export function LobbyDetailsPanel({lobby}: LobbyDetailsPanelProps): React.JSX.Element {
  const icon = (Icon: typeof CalendarDays) => <Icon color={colors.brand} size={22} />;
  const address = venueAddress(lobby);

  return (
    <View style={styles.panel}>
      <DetailsRow>
        <DetailItem
          icon={icon(CalendarDays)}
          label="Date"
          value={formatLobbyDate(lobby.startsAt, lobby.venueTimezone)}
        />
        <DetailItem
          icon={icon(Clock3)}
          label="Time"
          value={formatLobbyTimeRange(lobby)}
        />
      </DetailsRow>

      <View style={styles.locationRow}>
        <DetailItem
          icon={icon(MapPin)}
          label="Location"
          value={lobby.venueName || 'Sports venue'}
          supporting={address}
        />
        {hasCoordinates(lobby) ? <LobbyMapPreview lobby={lobby} /> : null}
      </View>

      <DetailsRow>
        <DetailItem
          icon={icon(LayoutGrid)}
          label="Court"
          value={lobby.courtName || 'Court'}
        />
      </DetailsRow>

      <DetailsRow>
        <DetailItem
          icon={icon(CircleDollarSign)}
          label="Price"
          value={`${lobby.currencyCode} ${formatLobbyPrice(lobby.pricePerSeat)}`}
          supporting="per player"
        />
        <DetailItem
          icon={icon(CircleDollarSign)}
          label="Pricing model"
          value={pricingModelLabel(lobby.pricingModel)}
          supporting="Secure seat"
        />
      </DetailsRow>

      <DetailsRow>
        <DetailItem
          icon={icon(UsersRound)}
          label="Capacity"
          value={`${lobby.reservedPlayers} / ${lobby.maxPlayers}`}
          supporting="Joined / Max"
        />
        <DetailItem
          icon={icon(UsersRound)}
          label="Min players needed"
          value={String(lobby.minPlayers)}
          supporting="to start"
        />
      </DetailsRow>

      <DetailsRow>
        <DetailItem
          icon={icon(TimerReset)}
          label="Confirmation deadline"
          value={formatLobbyDeadline(lobby.confirmationDeadlineAt, lobby.venueTimezone)}
          supporting={formatDeadlineLeadTime(lobby.confirmationDeadlineAt, lobby.startsAt)}
        />
        <DetailItem
          icon={icon(XCircle)}
          label="Cancellation deadline"
          value={formatLobbyDeadline(lobby.cancellationDeadlineAt, lobby.venueTimezone)}
          supporting={formatDeadlineLeadTime(lobby.cancellationDeadlineAt, lobby.startsAt)}
        />
      </DetailsRow>

      {lobby.description ? (
        <DetailsRow>
          <DetailItem
            icon={icon(FileText)}
            label="Description / Rules"
            value={lobby.description}
          />
        </DetailsRow>
      ) : null}

      {lobby.venueContactPhone ? (
        <View style={styles.contactRow}>
          <DetailItem
            icon={icon(Phone)}
            label="Venue contact"
            value={lobby.venueContactPhone}
            supporting="Call or WhatsApp"
          />
          <Pressable
            accessibilityLabel="Message venue on WhatsApp"
            accessibilityRole="button"
            onPress={() => openWhatsApp(lobby.venueContactPhone!)}
            style={({pressed}) => [styles.messageButton, pressed && styles.pressed]}>
            <MessageCircle color={colors.brand} size={20} />
            <Text style={styles.messageText}>Message</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function DetailsRow({children}: React.PropsWithChildren): React.JSX.Element {
  return <View style={styles.row}>{children}</View>;
}

function DetailItem({
  icon,
  label,
  value,
  supporting,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  supporting?: string;
}): React.JSX.Element {
  return (
    <View style={styles.item}>
      <View style={styles.icon}>{icon}</View>
      <View style={styles.itemCopy}>
        <Text style={styles.itemLabel}>{label}</Text>
        <Text style={styles.itemValue}>{value}</Text>
        {supporting ? <Text style={styles.itemSupporting}>{supporting}</Text> : null}
      </View>
    </View>
  );
}

function LobbyMapPreview({lobby}: {lobby: Lobby}): React.JSX.Element {
  const coordinate = {
    latitude: Number(lobby.venueLatitude),
    longitude: Number(lobby.venueLongitude),
  };

  return (
    <Pressable
      accessibilityLabel="Open venue in maps"
      accessibilityRole="button"
      onPress={() => openMaps(lobby)}
      style={({pressed}) => [styles.mapFrame, pressed && styles.pressed]}>
      <MapView
        initialRegion={{...coordinate, latitudeDelta: 0.012, longitudeDelta: 0.012}}
        pitchEnabled={false}
        pointerEvents="none"
        rotateEnabled={false}
        scrollEnabled={false}
        style={styles.map}
        toolbarEnabled={false}
        zoomEnabled={false}>
        <Marker coordinate={coordinate} pinColor={colors.brand} />
      </MapView>
    </Pressable>
  );
}

function hasCoordinates(lobby: Lobby): boolean {
  return Number.isFinite(Number(lobby.venueLatitude)) && Number.isFinite(Number(lobby.venueLongitude));
}

async function openMaps(lobby: Lobby): Promise<void> {
  const latitude = Number(lobby.venueLatitude);
  const longitude = Number(lobby.venueLongitude);
  const label = encodeURIComponent(lobby.venueName || lobby.courtName || 'Venue');
  const nativeUrl = Platform.select({
    ios: `maps://?ll=${latitude},${longitude}&q=${label}`,
    android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`,
    default: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
  })!;
  const fallback = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  await Linking.openURL((await Linking.canOpenURL(nativeUrl)) ? nativeUrl : fallback);
}

function openWhatsApp(phone: string): Promise<void> {
  return Linking.openURL(`https://wa.me/${phone.replace(/\D/g, '')}`);
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
  },
  row: {
    borderBottomColor: colors.divider,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.lg,
    paddingVertical: spacing.lg,
  },
  locationRow: {
    alignItems: 'center',
    borderBottomColor: colors.divider,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  item: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minWidth: 0,
  },
  icon: {
    alignItems: 'center',
    paddingTop: spacing.xs,
    width: 24,
  },
  itemCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  itemLabel: {
    ...typography.caption,
    color: colors.muted,
  },
  itemValue: {
    ...typography.button,
    color: colors.ink,
  },
  itemSupporting: {
    ...typography.caption,
    color: colors.muted,
  },
  mapFrame: {
    borderRadius: radii.md,
    height: 104,
    overflow: 'hidden',
    width: '42%',
  },
  map: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  contactRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  messageButton: {
    alignItems: 'center',
    borderColor: colors.brand,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.lg,
  },
  messageText: {
    ...typography.button,
    color: colors.brand,
  },
  pressed: {
    opacity: 0.72,
  },
});
