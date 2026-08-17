import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {ChevronLeft, Share2} from 'lucide-react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AppButton, Notice} from '../../../components';
import {apiClient} from '../../../services/api/apiClient';
import {AuthenticatedSession} from '../../../services/session/sessionTypes';
import {colors, spacing, typography} from '../../../theme/tokens';
import {showError} from '../../auth/utils/authErrors';
import {Lobby, lobbiesApi} from '../../lobbies/api';
import {LobbyDetailsHero} from '../../lobbies/components/LobbyDetailsHero';
import {LobbyDetailsPanel} from '../../lobbies/components/LobbyDetailsPanel';
import {ReserveSeatButton} from '../../lobbies/components/ReserveSeatButton';
import {
  formatLobbyDate,
  formatLobbyPrice,
  formatLobbyTime,
} from '../../lobbies/utils/lobbyFormatting';
import {reservationsApi} from '../../reservations/api';

type NoticeState = {
  title?: string;
  message?: string;
  tone?: 'info' | 'success' | 'error' | 'warning';
};

type LobbyDetailsScreenProps = {
  lobbyId: string;
  session: AuthenticatedSession;
  onBack: () => void;
};

export function LobbyDetailsScreen({
  lobbyId,
  session,
  onBack,
}: LobbyDetailsScreenProps): React.JSX.Element {
  const [lobby, setLobby] = useState<Lobby>();
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [reserved, setReserved] = useState(false);
  const [notice, setNotice] = useState<NoticeState>({});

  const loadLobby = useCallback(async (showLoader = true) => {
    if (showLoader) {
      setLoading(true);
    }
    try {
      setLobby(await lobbiesApi.get(apiClient, lobbyId));
    } catch (error) {
      showError(error, setNotice);
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }, [lobbyId]);

  useEffect(() => {
    loadLobby();
  }, [loadLobby]);

  const reserveSeat = async () => {
    if (!lobby) {
      return;
    }
    setJoining(true);
    setNotice({});
    try {
      await reservationsApi.join(apiClient, session.tokens.accessToken, lobby.id);
      setReserved(true);
      setNotice({
        title: 'Seat reserved',
        message: 'Your reservation is confirmed and available in Bookings.',
        tone: 'success',
      });
      await loadLobby(false);
    } catch (error) {
      showError(error, setNotice);
      await loadLobby(false);
    } finally {
      setJoining(false);
    }
  };

  const shareLobby = async () => {
    if (!lobby) {
      return;
    }
    try {
      await Share.share({
        message: `${lobby.sportName || 'Sports lobby'} at ${
          lobby.venueName || lobby.courtName || 'the venue'
        } on ${formatLobbyDate(lobby.startsAt, lobby.venueTimezone)} at ${formatLobbyTime(
          lobby.startsAt,
          lobby.venueTimezone,
        )}`,
        title: 'Lobby details',
      });
    } catch (error) {
      showError(error, setNotice);
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.safe}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Back"
          accessibilityRole="button"
          onPress={onBack}
          style={({pressed}) => [styles.backButton, pressed && styles.pressed]}>
          <ChevronLeft color={colors.brand} size={26} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Lobby Details</Text>
        <Pressable
          accessibilityLabel="Share lobby"
          accessibilityRole="button"
          disabled={!lobby}
          onPress={shareLobby}
          style={({pressed}) => [styles.iconButton, pressed && styles.pressed]}>
          <Share2 color={colors.brand} size={24} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.brand} size="large" />
          <Text style={styles.stateText}>Loading lobby details...</Text>
        </View>
      ) : !lobby ? (
        <View style={styles.centerState}>
          <Notice
            message={notice.message || 'The lobby details could not be loaded.'}
            title={notice.title || 'Unable to load lobby'}
            tone="error"
          />
          <AppButton label="Try again" onPress={() => loadLobby()} variant="brandOutline" />
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}>
            <Notice
              message={notice.message}
              onDismiss={() => setNotice({})}
              title={notice.title}
              tone={notice.tone}
            />
            <LobbyDetailsHero lobby={lobby} />
            <LobbyDetailsPanel lobby={lobby} />
          </ScrollView>
          <View style={styles.footer}>
            <ReserveSeatButton
              disabled={reserved || !isJoinable(lobby)}
              label={reserveLabel(lobby, reserved)}
              loading={joining}
              onPress={reserveSeat}
              priceLabel={`${lobby.currencyCode} ${formatLobbyPrice(lobby.pricePerSeat)} per player`}
            />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

function isJoinable(lobby: Lobby): boolean {
  return lobby.status === 'OPEN' && lobby.availableSeats > 0;
}

function reserveLabel(lobby: Lobby, reserved: boolean): string {
  if (reserved) {
    return 'Seat reserved';
  }
  if (lobby.status === 'FULL' || lobby.availableSeats <= 0) {
    return 'Lobby full';
  }
  if (lobby.status !== 'OPEN') {
    return 'Reservations closed';
  }
  return 'Reserve seat';
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.background,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomColor: colors.divider,
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 58,
    paddingHorizontal: spacing.md,
  },
  backButton: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 44,
    width: 92,
  },
  backText: {
    ...typography.body,
    color: colors.brand,
  },
  headerTitle: {
    ...typography.sectionTitle,
    color: colors.ink,
    flex: 1,
    textAlign: 'center',
  },
  iconButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 92,
  },
  content: {
    gap: spacing.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  centerState: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.lg,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  stateText: {
    ...typography.body,
    color: colors.muted,
  },
  footer: {
    backgroundColor: colors.surface,
    borderTopColor: colors.divider,
    borderTopWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  pressed: {
    opacity: 0.65,
  },
});
