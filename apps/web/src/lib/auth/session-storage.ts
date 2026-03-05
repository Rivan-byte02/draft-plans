import type { AuthSession } from '@draft-plans/shared';

const authSessionStorageKey = 'draft-plans-auth-session';

function isBrowserEnvironment() {
  return typeof window !== 'undefined';
}

export function getStoredAuthSession(): AuthSession | null {
  if (!isBrowserEnvironment()) {
    return null;
  }

  const serializedSession = window.localStorage.getItem(authSessionStorageKey);
  if (!serializedSession) {
    return null;
  }

  try {
    const parsedSession = JSON.parse(serializedSession) as AuthSession;
    const expiresAtTimestamp = Date.parse(parsedSession.expiresAt);

    if (Number.isNaN(expiresAtTimestamp) || expiresAtTimestamp <= Date.now()) {
      window.localStorage.removeItem(authSessionStorageKey);
      return null;
    }

    return parsedSession;
  } catch {
    window.localStorage.removeItem(authSessionStorageKey);
    return null;
  }
}

export function setStoredAuthSession(nextSession: AuthSession | null) {
  if (!isBrowserEnvironment()) {
    return;
  }

  if (!nextSession) {
    window.localStorage.removeItem(authSessionStorageKey);
    return;
  }

  window.localStorage.setItem(authSessionStorageKey, JSON.stringify(nextSession));
}

export function getStoredAccessToken() {
  return getStoredAuthSession()?.accessToken ?? null;
}
