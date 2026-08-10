export type SessionTokens = {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  tokenType: string;
};

export type SessionUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneE164: string;
  phoneVerified: boolean;
  phoneVerifiedAt?: string;
  status: string;
  roles: string[];
};

export type AuthenticatedSession = {
  userId: string;
  user: SessionUser;
  tokens: SessionTokens;
};
