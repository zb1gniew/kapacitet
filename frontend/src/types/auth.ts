export type AuthenticatedUser = {
  sub: string;
  email?: string;
  name?: string;
  preferredUsername?: string;
  emailVerified?: boolean;
};

export type AuthSession = {
  user: AuthenticatedUser;
  accessToken: string;
  idToken?: string;
  tokenType?: string;
  refreshToken?: string;
  expiresAt: number;
  refreshExpiresAt?: number;
  onboardingCompleted?: boolean;
};

export type AuthTransaction = {
  state: string;
  codeVerifier: string;
  nonce: string;
  returnTo: string;
};

export type OidcDiscoveryDocument = {
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint: string;
  end_session_endpoint?: string;
  jwks_uri: string;
  issuer: string;
};

export type OidcTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_expires_in?: number;
  refresh_token?: string;
  token_type?: string;
  id_token?: string;
};

export type OidcUserInfo = {
  sub: string;
  email?: string;
  name?: string;
  preferred_username?: string;
  email_verified?: boolean;
};
