import {ApiClient} from '../../services/api/apiClient';

export type Sport = {
  id: string;
  code: string;
  name: string;
};

export const sportsApi = {
  list(client: ApiClient) {
    return client.get<Sport[]>('/sports');
  },
};
