import {ApiClient} from '../../services/api/apiClient';

export type Venue = {
  id: string;
  vendorId: string;
  name: string;
  description?: string;
  countryCode: string;
  city: string;
  area?: string;
  addressLine: string;
  latitude?: number;
  longitude?: number;
  timezone: string;
  contactPhone: string;
  status: string;
};

export type CreateVenueRequest = {
  name: string;
  description?: string;
  countryCode: string;
  city: string;
  area?: string;
  addressLine: string;
  latitude?: number;
  longitude?: number;
  timezone: string;
  contactPhone: string;
};

export const venuesApi = {
  create(client: ApiClient, accessToken: string, request: CreateVenueRequest) {
    return client.post<Venue>('/vendor/venues', request, accessToken);
  },
  listMine(client: ApiClient, accessToken: string) {
    return client.get<Venue[]>('/vendor/venues', accessToken);
  },
};
