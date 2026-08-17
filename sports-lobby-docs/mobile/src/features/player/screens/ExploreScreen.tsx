import React, {useCallback, useEffect, useRef, useState} from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import {MapPin, Search} from 'lucide-react-native';
import {useFocusEffect} from '@react-navigation/native';
import {
  AppScreen,
  AppTextField,
  EmptyState,
  LobbyCard,
  Notice,
  SegmentTabs,
} from '../../../components';
import {apiClient} from '../../../services/api/apiClient';
import {colors, spacing, typography} from '../../../theme/tokens';
import {showError} from '../../auth/utils/authErrors';
import {Lobby, lobbiesApi} from '../../lobbies/api';
import {Sport, sportsApi} from '../../sports/api';

type ExploreScreenProps = {
  onOpenLobby: (lobbyId: string) => void;
};

type NoticeState = {
  title?: string;
  message?: string;
  tone?: 'info' | 'success' | 'error' | 'warning';
};

export function ExploreScreen({onOpenLobby}: ExploreScreenProps): React.JSX.Element {
  const [sports, setSports] = useState<Sport[]>([]);
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [selectedSportId, setSelectedSportId] = useState('');
  const [city, setCity] = useState('Amman');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<NoticeState>({});
  const [refreshKey, setRefreshKey] = useState(0);
  const searchRequestId = useRef(0);

  useFocusEffect(
    useCallback(() => {
      setRefreshKey(value => value + 1);
    }, []),
  );

  useEffect(() => {
    let active = true;
    const loadSports = async () => {
      try {
        const nextSports = await sportsApi.list(apiClient);
        if (active) {
          setSports(nextSports);
        }
      } catch (error) {
        if (active) {
          showError(error, setNotice);
        }
      }
    };
    loadSports();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const requestId = ++searchRequestId.current;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const nextLobbies = await lobbiesApi.discover(apiClient, {
          sportId: selectedSportId || undefined,
          city: city.trim() || undefined,
          search: search.trim() || undefined,
        });
        if (active && requestId === searchRequestId.current) {
          setLobbies(nextLobbies);
          setNotice({});
        }
      } catch (error) {
        if (active && requestId === searchRequestId.current) {
          showError(error, setNotice);
        }
      } finally {
        if (active && requestId === searchRequestId.current) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [city, refreshKey, search, selectedSportId]);

  return (
    <AppScreen
      title="Explore Lobbies"
      subtitle="Find games, reserve seats, and play together."
      contentStyle={styles.screen}>
      <Notice
        title={notice.title}
        message={notice.message}
        tone={notice.tone}
        onDismiss={() => setNotice({})}
      />

      <View style={styles.filters}>
        <View style={styles.searchField}>
          <AppTextField
            label="Search by venue, court, or area"
            appearance="auth"
            showLabel={false}
            placeholder="Search by venue or area"
            value={search}
            onChangeText={setSearch}
            leadingIcon={<Search color={colors.icon} size={20} />}
          />
        </View>
        <View style={styles.cityField}>
          <AppTextField
            label="City"
            appearance="auth"
            showLabel={false}
            placeholder="City"
            value={city}
            onChangeText={setCity}
            leadingIcon={<MapPin color={colors.brand} size={20} />}
            inputStyle={styles.cityInput}
          />
        </View>
      </View>

      <SegmentTabs
        items={[
          {key: '', label: 'All sports'},
          ...sports.map(sport => ({key: sport.id, label: sport.name})),
        ]}
        value={selectedSportId}
        onChange={setSelectedSportId}
        variant="pill"
      />

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsTitle}>Available games</Text>
        {!loading ? <Text style={styles.resultsCount}>{lobbies.length} found</Text> : null}
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.brand} size="large" />
          <Text style={styles.loadingText}>Finding available lobbies...</Text>
        </View>
      ) : (
        <View style={[styles.list, lobbies.length === 0 && styles.emptyResults]}>
          {lobbies.length === 0 ? (
            <EmptyState
              title="No games found"
              message="Try another sport, venue name, area, or city."
              alignment="center"
            />
          ) : (
            lobbies.map(lobby => (
              <LobbyCard
                key={lobby.id}
                lobby={lobby}
                sportName={lobby.sportName || sports.find(sport => sport.id === lobby.sportId)?.name}
                actionLabel="Join lobby"
                onAction={() => onOpenLobby(lobby.id)}
                onPress={() => onOpenLobby(lobby.id)}
              />
            ))
          )}
        </View>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {paddingBottom: spacing.xxl},
  filters: {flexDirection: 'row', gap: spacing.sm},
  searchField: {flex: 1},
  cityField: {width: 112},
  cityInput: {fontSize: 14},
  resultsHeader: {alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between'},
  resultsTitle: {...typography.sectionTitle, color: colors.ink},
  resultsCount: {...typography.caption, color: colors.muted},
  loading: {alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl},
  loadingText: {...typography.body, color: colors.muted},
  list: {gap: spacing.lg},
  emptyResults: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
  },
});
