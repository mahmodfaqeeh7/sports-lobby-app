import React, {useCallback, useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {AppButton, AppScreen, AppTextField, EmptyState, LobbyCard, Notice, SegmentTabs} from '../../../components';
import {apiClient} from '../../../services/api/apiClient';
import {AuthenticatedSession} from '../../../services/session/sessionTypes';
import {spacing} from '../../../theme/tokens';
import {Lobby, lobbiesApi} from '../../lobbies/api';
import {reservationsApi} from '../../reservations/api';
import {Sport, sportsApi} from '../../sports/api';
import {showError} from '../../auth/screens/AuthScreen';

type ExploreScreenProps = {
  session: AuthenticatedSession;
};

export function ExploreScreen({session}: ExploreScreenProps): React.JSX.Element {
  const [sports, setSports] = useState<Sport[]>([]);
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [selectedSportId, setSelectedSportId] = useState('');
  const [city, setCity] = useState('Amman');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{title?: string; message?: string; tone?: 'info' | 'success' | 'error' | 'warning'}>({});

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const nextSports = await sportsApi.list(apiClient);
      const sportId = selectedSportId || nextSports[0]?.id || '';
      const nextLobbies = await lobbiesApi.discover(apiClient, {
        sportId: sportId || undefined,
        city: city || undefined,
      });
      setSports(nextSports);
      setSelectedSportId(sportId);
      setLobbies(nextLobbies);
      setNotice({});
    } catch (error) {
      showError(error, setNotice);
    } finally {
      setBusy(false);
    }
  }, [city, selectedSportId]);

  useEffect(() => {
    load();
  }, [load]);

  const join = async (lobbyId: string) => {
    setBusy(true);
    try {
      await reservationsApi.join(apiClient, session.tokens.accessToken, lobbyId);
      setNotice({title: 'Seat reserved', message: 'You are in. Check Bookings for your reservation.', tone: 'success'});
      await load();
    } catch (error) {
      showError(error, setNotice);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppScreen title="Find a Game" subtitle="Browse open lobbies and reserve your seat.">
      <Notice title={notice.title} message={notice.message} tone={notice.tone} onDismiss={() => setNotice({})} />
      <AppTextField label="City" value={city} onChangeText={setCity} />
      <SegmentTabs
        items={sports.map(sport => ({key: sport.id, label: sport.name}))}
        value={selectedSportId}
        onChange={setSelectedSportId}
      />
      <AppButton label="Search" onPress={load} disabled={busy} variant="secondary" />
      <View style={styles.list}>
        {lobbies.length === 0 ? (
          <EmptyState title="No games found" message="Try another sport or city, or check back when venues publish new lobbies." />
        ) : (
          lobbies.map(lobby => (
            <LobbyCard
              key={lobby.id}
              lobby={lobby}
              sportName={sports.find(sport => sport.id === lobby.sportId)?.name}
              actionLabel="Join lobby"
              onAction={() => join(lobby.id)}
              disabled={busy || lobby.availableSeats <= 0}
            />
          ))
        )}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
});
