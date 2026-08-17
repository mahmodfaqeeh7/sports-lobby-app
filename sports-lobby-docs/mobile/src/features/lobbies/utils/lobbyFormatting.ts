import {Lobby} from '../api';

export function formatLobbyDate(value: string, timeZone?: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    timeZone,
    weekday: 'short',
    year: 'numeric',
  });
}

export function formatLobbyTime(value: string, timeZone?: string): string {
  return new Date(value).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  });
}

export function formatLobbyTimeRange(lobby: Lobby): string {
  return `${formatLobbyTime(lobby.startsAt, lobby.venueTimezone)} - ${formatLobbyTime(
    lobby.endsAt,
    lobby.venueTimezone,
  )}`;
}

export function formatLobbyDeadline(value: string, timeZone?: string): string {
  return new Date(value).toLocaleString(undefined, {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    timeZone,
    weekday: 'short',
  });
}

export function formatDeadlineLeadTime(deadline: string, startsAt: string): string {
  const minutes = Math.max(
    0,
    Math.round((new Date(startsAt).getTime() - new Date(deadline).getTime()) / 60_000),
  );
  if (minutes % 1_440 === 0) {
    return `${minutes / 1_440}d before start`;
  }
  if (minutes % 60 === 0) {
    return `${minutes / 60}h before start`;
  }
  return `${minutes}m before start`;
}

export function lobbyDurationMinutes(lobby: Lobby): number {
  return Math.max(
    1,
    Math.round(
      (new Date(lobby.endsAt).getTime() - new Date(lobby.startsAt).getTime()) / 60_000,
    ),
  );
}

export function formatLobbyPrice(value: number): string {
  return Number(value).toLocaleString(undefined, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
}

export function pricingModelLabel(value: string): string {
  return value === 'TOTAL_COURT_PRICE' ? 'Total court price' : 'Pay per player';
}

export function venueAddress(lobby: Lobby): string {
  return [
    lobby.venueAddress,
    lobby.venueArea,
    lobby.venueCity,
    lobby.venueCountryCode,
  ]
    .filter(Boolean)
    .join(', ');
}
