import React, {useCallback, useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {AppButton, AppScreen, EmptyState, Notice, ReservationCard} from '../../../components';
import {apiClient} from '../../../services/api/apiClient';
import {AuthenticatedSession} from '../../../services/session/sessionTypes';
import {spacing} from '../../../theme/tokens';
import {Reservation, reservationsApi} from '../../reservations/api';
import {showError} from '../../auth/utils/authErrors';

type MyReservationsScreenProps = {
  session: AuthenticatedSession;
};

export function MyReservationsScreen({session}: MyReservationsScreenProps): React.JSX.Element {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{title?: string; message?: string; tone?: 'info' | 'success' | 'error' | 'warning'}>({});

  const load = useCallback(async () => {
    setBusy(true);
    try {
      setReservations(await reservationsApi.mine(apiClient, session.tokens.accessToken));
      setNotice({});
    } catch (error) {
      showError(error, setNotice);
    } finally {
      setBusy(false);
    }
  }, [session.tokens.accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  const cancel = async (reservationId: string) => {
    setBusy(true);
    try {
      const cancelled = await reservationsApi.cancel(apiClient, session.tokens.accessToken, reservationId);
      setReservations(current => current.map(item => (item.id === cancelled.id ? cancelled : item)));
      setNotice({title: 'Reservation cancelled', message: 'The seat was released back to the lobby.', tone: 'success'});
    } catch (error) {
      showError(error, setNotice);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppScreen title="Bookings" subtitle="Your upcoming and past lobby reservations.">
      <Notice title={notice.title} message={notice.message} tone={notice.tone} onDismiss={() => setNotice({})} />
      <AppButton label="Refresh" onPress={load} disabled={busy} variant="secondary" />
      <View style={styles.list}>
        {reservations.length === 0 ? (
          <EmptyState title="No bookings yet" message="Find a game and reserve your first seat." />
        ) : (
          reservations.map(reservation => (
            <ReservationCard
              key={reservation.id}
              reservation={reservation}
              onCancel={() => cancel(reservation.id)}
              disabled={busy}
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
