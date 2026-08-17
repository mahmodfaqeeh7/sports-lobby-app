import React from 'react';
import {Text} from 'react-native';
import {
  act,
  create,
  ReactTestInstance,
  ReactTestRenderer,
} from 'react-test-renderer';
import {Lobby, lobbiesApi} from '../src/features/lobbies/api';
import {LobbyDetailsScreen} from '../src/features/player/screens/LobbyDetailsScreen';
import {reservationsApi} from '../src/features/reservations/api';
import {AuthenticatedSession} from '../src/services/session/sessionTypes';

jest.mock('../src/features/lobbies/api', () => ({
  lobbiesApi: {
    get: jest.fn(),
  },
}));

jest.mock('../src/features/reservations/api', () => ({
  reservationsApi: {
    join: jest.fn(),
  },
}));

const lobby: Lobby = {
  id: 'lobby-1',
  vendorId: 'vendor-1',
  venueId: 'venue-1',
  venueName: 'Goal Sports Arena',
  venueCity: 'Amman',
  venueArea: 'Abdoun',
  venueAddress: 'Prince Hashim Street',
  venueCountryCode: 'JO',
  venueLatitude: 31.95,
  venueLongitude: 35.91,
  venueContactPhone: '+962790000000',
  courtId: 'court-1',
  courtName: 'Five-a-side Pitch',
  sportId: 'sport-1',
  sportName: 'Football',
  status: 'OPEN',
  startsAt: '2026-08-20T15:00:00Z',
  endsAt: '2026-08-20T16:30:00Z',
  venueTimezone: 'Asia/Amman',
  minPlayers: 6,
  maxPlayers: 10,
  reservedPlayers: 4,
  availableSeats: 6,
  pricingModel: 'PRICE_PER_PLAYER',
  currencyCode: 'JOD',
  pricePerSeat: 5,
  description: 'Friendly football lobby.',
  cancellationDeadlineAt: '2026-08-20T11:00:00Z',
  confirmationDeadlineAt: '2026-08-20T12:00:00Z',
};

const session: AuthenticatedSession = {
  userId: 'player-1',
  user: {
    id: 'player-1',
    firstName: 'Demo',
    lastName: 'Player',
    email: 'player@example.com',
    phoneE164: '+962790000001',
    phoneVerified: true,
    status: 'ACTIVE',
    roles: ['PLAYER'],
  },
  tokens: {
    accessToken: 'access-token',
    accessTokenExpiresAt: '2026-08-20T10:00:00Z',
    refreshToken: 'refresh-token',
    refreshTokenExpiresAt: '2026-09-20T10:00:00Z',
    tokenType: 'Bearer',
  },
};

function buttonWithLabel(
  renderer: ReactTestRenderer,
  label: string,
): ReactTestInstance {
  return renderer.root.findAll(
    node =>
      node.props.accessibilityRole === 'button' &&
      node.findAllByType(Text).some(text => text.props.children === label),
  )[0];
}

beforeEach(() => {
  jest.mocked(lobbiesApi.get).mockResolvedValue(lobby);
  jest.mocked(reservationsApi.join).mockResolvedValue({
    id: 'reservation-1',
    lobbyId: lobby.id,
    userId: session.userId,
    status: 'RESERVED',
    seatCount: 1,
    unitPriceSnapshot: lobby.pricePerSeat,
    currencyCodeSnapshot: lobby.currencyCode,
    reservedAt: '2026-08-17T07:00:00Z',
    attendanceStatus: 'UNKNOWN',
  });
});

afterEach(() => {
  jest.resetAllMocks();
});

it('loads lobby details and reserves a seat through the backend', async () => {
  let renderer: ReactTestRenderer | undefined;

  await act(async () => {
    renderer = create(
      <LobbyDetailsScreen
        lobbyId={lobby.id}
        onBack={jest.fn()}
        session={session}
      />,
    );
  });

  expect(lobbiesApi.get).toHaveBeenCalledWith(expect.anything(), lobby.id);
  expect(
    renderer!.root
      .findAllByType(Text)
      .some(text => text.props.children === 'Goal Sports Arena'),
  ).toBe(true);

  await act(async () => {
    await buttonWithLabel(renderer!, 'Reserve seat').props.onPress();
  });

  expect(reservationsApi.join).toHaveBeenCalledWith(
    expect.anything(),
    session.tokens.accessToken,
    lobby.id,
  );
  expect(buttonWithLabel(renderer!, 'Seat reserved')).toBeTruthy();

  await act(async () => renderer?.unmount());
});
