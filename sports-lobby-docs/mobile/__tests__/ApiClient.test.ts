import {ApiClient, ApiClientError} from '../src/services/api/apiClient';

function response(status: number, body?: unknown): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    text: jest.fn().mockResolvedValue(body === undefined ? '' : JSON.stringify(body)),
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe('ApiClient token recovery', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('refreshes once and retries a request with the new access token', async () => {
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(response(401, {error: {message: 'Expired'}}))
      .mockResolvedValueOnce(response(200, {id: 'vendor-1'}));
    const client = new ApiClient('https://api.example.test');
    const refresh = jest.fn().mockResolvedValue('new-access-token');
    client.setUnauthorizedHandler(refresh);

    await expect(client.get('/vendor/me', 'old-access-token')).resolves.toEqual({
      id: 'vendor-1',
    });

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][1]).toEqual(
      expect.objectContaining({
        headers: expect.objectContaining({Authorization: 'Bearer new-access-token'}),
      }),
    );
  });

  it('does not enter a retry loop when the refreshed token is rejected', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(response(401, {error: {message: 'Expired'}}))
      .mockResolvedValueOnce(response(401, {error: {message: 'Rejected'}}));
    const client = new ApiClient('https://api.example.test');
    const refresh = jest.fn().mockResolvedValue('new-access-token');
    client.setUnauthorizedHandler(refresh);

    await expect(client.get('/vendor/me', 'old-access-token')).rejects.toMatchObject({
      status: 401,
    } satisfies Partial<ApiClientError>);
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
