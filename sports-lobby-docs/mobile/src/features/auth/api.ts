import {ApiClient} from '../../services/api/apiClient';
import {AuthenticatedSession, SessionTokens, SessionUser} from '../../services/session/sessionTypes';

export type AuthResponse = {
  user: SessionUser;
  tokens: SessionTokens;
};

export type RegisterPlayerRequest = {
  firstName: string;
  lastName: string;
  email: string;
  phoneE164: string;
  password: string;
  deviceLabel?: string;
};

export type LoginRequest = {
  phoneE164: string;
  password: string;
  deviceLabel?: string;
};

export type OtpResponse = {
  status: string;
  expiresAt: string;
  resendAvailableAt: string;
};

export type GenericStatusResponse = {
  status: string;
};

export function toSession(response: AuthResponse): AuthenticatedSession {
  return {
    userId: response.user.id,
    user: response.user,
    tokens: response.tokens,
  };
}

export const authApi = {
  registerPlayer(client: ApiClient, request: RegisterPlayerRequest) {
    return client.post<AuthResponse>('/auth/register', request);
  },
  login(client: ApiClient, request: LoginRequest) {
    return client.post<AuthResponse>('/auth/login', request);
  },
  requestOtp(client: ApiClient, phoneE164: string) {
    return client.post<OtpResponse>('/auth/otp/request', {phoneE164});
  },
  verifyOtp(client: ApiClient, phoneE164: string, code: string) {
    return client.post<SessionUser>('/auth/otp/verify', {phoneE164, code});
  },
  refresh(client: ApiClient, refreshToken: string) {
    return client.post<AuthResponse>('/auth/refresh', {refreshToken});
  },
  logout(client: ApiClient, refreshToken: string, allDevices: boolean) {
    return client.post<GenericStatusResponse>('/auth/logout', {refreshToken, allDevices});
  },
  forgotPassword(client: ApiClient, phoneE164: string) {
    return client.post<GenericStatusResponse>('/auth/password/forgot', {phoneE164});
  },
  resetPassword(client: ApiClient, resetToken: string, newPassword: string) {
    return client.post<GenericStatusResponse>('/auth/password/reset', {resetToken, newPassword});
  },
};
