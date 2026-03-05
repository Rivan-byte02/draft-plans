export type LoginPayload = {
  email: string;
  password: string;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string;
};

export type AuthSession = {
  accessToken: string;
  tokenType: 'Bearer';
  expiresAt: string;
  user: AuthUser;
};
