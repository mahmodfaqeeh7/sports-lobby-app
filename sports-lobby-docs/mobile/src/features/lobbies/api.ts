import {ApiClient} from '../../services/api/apiClient';

export type Court = {
  id: string;
  venueId: string;
  name: string;
  description?: string;
  status: string;
  defaultMinPlayers?: number;
  defaultMaxPlayers?: number;
  imageFileId?: string;
  imageUrl?: string;
  imageUrlExpiresAt?: string;
  sportIds: string[];
};

export type Lobby = {
  id: string;
  vendorId: string;
  venueId: string;
  venueName?: string;
  venueCity?: string;
  venueArea?: string;
  venueAddress?: string;
  venueCountryCode?: string;
  venueLatitude?: number;
  venueLongitude?: number;
  venueContactPhone?: string;
  courtId: string;
  courtName?: string;
  courtImageUrl?: string;
  courtImageUrlExpiresAt?: string;
  sportId: string;
  sportCode?: string;
  sportName?: string;
  status: string;
  startsAt: string;
  endsAt: string;
  venueTimezone: string;
  minPlayers: number;
  maxPlayers: number;
  reservedPlayers: number;
  availableSeats: number;
  pricingModel: string;
  currencyCode: string;
  totalCourtPrice?: number;
  pricePerSeat: number;
  description?: string;
  cancellationDeadlineAt: string;
  confirmationDeadlineAt: string;
  publishedAt?: string;
};

export type CreateCourtRequest = {
  name: string;
  description?: string;
  defaultMinPlayers?: number;
  defaultMaxPlayers?: number;
  imageFileId: string;
  sportIds: string[];
};

export type CourtImageUpload = {
  fileId: string;
  uploadUrl: string;
  method: string;
  headers: Record<string, string>;
  expiresAt: string;
};

export type CourtImageUploadStatus = {
  fileId: string;
  uploadStatus: string;
};

export type SaveLobbyRequest = {
  venueId: string;
  courtId: string;
  sportId: string;
  startsAt: string;
  endsAt: string;
  minPlayers: number;
  maxPlayers: number;
  pricingModel: 'PRICE_PER_PLAYER' | 'TOTAL_COURT_PRICE';
  currencyCode: string;
  priceAmount: number;
  description?: string;
  cancellationDeadlineAt: string;
  confirmationDeadlineAt: string;
};

function query(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      search.append(key, value);
    }
  });
  const value = search.toString();
  return value ? `?${value}` : '';
}

export const courtsApi = {
  createImageUpload(
    client: ApiClient,
    accessToken: string,
    request: {fileName: string; contentType: string; sizeBytes: number},
  ) {
    return client.post<CourtImageUpload>('/vendor/court-images/upload-url', request, accessToken);
  },
  completeImageUpload(client: ApiClient, accessToken: string, fileId: string) {
    return client.post<CourtImageUploadStatus>(`/vendor/court-images/${fileId}/complete`, undefined, accessToken);
  },
  create(client: ApiClient, accessToken: string, venueId: string, request: CreateCourtRequest) {
    return client.post<Court>(`/vendor/venues/${venueId}/courts`, request, accessToken);
  },
  list(client: ApiClient, accessToken: string, venueId: string) {
    return client.get<Court[]>(`/vendor/venues/${venueId}/courts`, accessToken);
  },
};

export const lobbiesApi = {
  create(client: ApiClient, accessToken: string, request: SaveLobbyRequest) {
    return client.post<Lobby>('/vendor/lobbies', request, accessToken);
  },
  editDraft(client: ApiClient, accessToken: string, lobbyId: string, request: SaveLobbyRequest) {
    return client.put<Lobby>(`/vendor/lobbies/${lobbyId}`, request, accessToken);
  },
  publish(client: ApiClient, accessToken: string, lobbyId: string) {
    return client.post<Lobby>(`/vendor/lobbies/${lobbyId}/publish`, undefined, accessToken);
  },
  listMine(client: ApiClient, accessToken: string) {
    return client.get<Lobby[]>('/vendor/lobbies', accessToken);
  },
  discover(client: ApiClient, filters: {sportId?: string; city?: string; search?: string}) {
    return client.get<Lobby[]>(`/lobbies${query(filters)}`);
  },
  get(client: ApiClient, lobbyId: string) {
    return client.get<Lobby>(`/lobbies/${lobbyId}`);
  },
};
