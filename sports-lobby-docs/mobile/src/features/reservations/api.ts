import {ApiClient} from '../../services/api/apiClient';

export type Reservation = {
  id: string;
  lobbyId: string;
  userId: string;
  status: string;
  seatCount: number;
  unitPriceSnapshot: number;
  currencyCodeSnapshot: string;
  reservedAt: string;
  cancelledAt?: string;
  cancellationActor?: string;
  cancellationReasonCode?: string;
  attendanceStatus?: string;
};

export const reservationsApi = {
  join(client: ApiClient, accessToken: string, lobbyId: string) {
    return client.post<Reservation>(`/lobbies/${lobbyId}/reservations`, undefined, accessToken);
  },
  mine(client: ApiClient, accessToken: string) {
    return client.get<Reservation[]>('/me/reservations', accessToken);
  },
  cancel(client: ApiClient, accessToken: string, reservationId: string, reasonCode = 'PLAYER_REQUEST') {
    return client.delete<Reservation>(`/reservations/${reservationId}`, {reasonCode}, accessToken);
  },
};
