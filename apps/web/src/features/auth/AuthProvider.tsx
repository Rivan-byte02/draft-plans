import type { AuthSession, LoginPayload } from '@draft-plans/shared';
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { setStoredAuthSession, getStoredAuthSession } from '@/lib/auth/session-storage';
import { login } from './auth.api';

type AuthContextValue = {
  session: AuthSession | null;
  loginWithCredentials: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(() => getStoredAuthSession());

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      session,
      loginWithCredentials: async (payload) => {
        const nextSession = await login(payload);
        setStoredAuthSession(nextSession);
        setSession(nextSession);
      },
      logout: () => {
        setStoredAuthSession(null);
        setSession(null);
      },
    }),
    [session],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contextValue = useContext(AuthContext);

  if (!contextValue) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return contextValue;
}
