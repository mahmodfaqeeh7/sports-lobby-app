import React, {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as Keychain from 'react-native-keychain';
import {authApi, toSession} from '../../features/auth/api';
import {apiClient} from '../api/apiClient';
import {AuthenticatedSession} from './sessionTypes';

const SESSION_SERVICE = 'com.sportslobby.mobile.session';
const REFRESH_EARLY_MS = 60_000;

type SessionContextValue = {
  session?: AuthenticatedSession;
  isHydrating: boolean;
  setSession: (session: AuthenticatedSession) => void;
  clearSession: () => void;
};

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({children}: PropsWithChildren): React.JSX.Element {
  const [session, setSessionState] = useState<AuthenticatedSession>();
  const [isHydrating, setIsHydrating] = useState(true);
  const sessionRef = useRef<AuthenticatedSession | undefined>(undefined);
  const refreshPromiseRef = useRef<Promise<string | undefined> | undefined>(undefined);

  const storeSession = useCallback((nextSession: AuthenticatedSession) => {
    sessionRef.current = nextSession;
    setSessionState(nextSession);
    Keychain.setGenericPassword('session', JSON.stringify(nextSession), {
      service: SESSION_SERVICE,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    }).catch(() => undefined);
  }, []);

  const clearSession = useCallback(() => {
    sessionRef.current = undefined;
    setSessionState(undefined);
    Keychain.resetGenericPassword({service: SESSION_SERVICE}).catch(() => undefined);
  }, []);

  useEffect(() => {
    let active = true;
    const restore = async () => {
      try {
        const stored = await Keychain.getGenericPassword({service: SESSION_SERVICE});
        if (!stored || !active) {
          return;
        }
        const restored = JSON.parse(stored.password) as AuthenticatedSession;
        if (!isValidSession(restored) || isExpired(restored.tokens.refreshTokenExpiresAt)) {
          await Keychain.resetGenericPassword({service: SESSION_SERVICE});
          return;
        }

        const nextSession = isExpiring(restored.tokens.accessTokenExpiresAt)
          ? toSession(await authApi.refresh(apiClient, restored.tokens.refreshToken))
          : restored;
        if (active) {
          setSessionState(nextSession);
          sessionRef.current = nextSession;
          if (nextSession !== restored) {
            await Keychain.setGenericPassword('session', JSON.stringify(nextSession), {
              service: SESSION_SERVICE,
              accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
            });
          }
        }
      } catch {
        await Keychain.resetGenericPassword({service: SESSION_SERVICE});
      } finally {
        if (active) {
          setIsHydrating(false);
        }
      }
    };
    restore().catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const refreshSession = useCallback((): Promise<string | undefined> => {
    const current = sessionRef.current;
    if (!current) {
      return Promise.resolve(undefined);
    }
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }
    const refresh = authApi
      .refresh(apiClient, current.tokens.refreshToken)
      .then(response => {
        const nextSession = toSession(response);
        storeSession(nextSession);
        return nextSession.tokens.accessToken;
      })
      .catch(() => {
        clearSession();
        return undefined;
      })
      .finally(() => {
        refreshPromiseRef.current = undefined;
      });
    refreshPromiseRef.current = refresh;
    return refresh;
  }, [clearSession, storeSession]);

  useEffect(() => {
    apiClient.setUnauthorizedHandler(failedAccessToken => {
      const current = sessionRef.current;
      if (!current) {
        return Promise.resolve(undefined);
      }
      if (current.tokens.accessToken !== failedAccessToken) {
        return Promise.resolve(current.tokens.accessToken);
      }
      return refreshSession();
    });
    return () => apiClient.setUnauthorizedHandler(undefined);
  }, [refreshSession]);

  useEffect(() => {
    if (!session) {
      return;
    }
    const refreshIn = Math.max(
      0,
      new Date(session.tokens.accessTokenExpiresAt).getTime() - Date.now() - REFRESH_EARLY_MS,
    );
    const timer = setTimeout(() => {
      refreshSession().catch(() => undefined);
    }, refreshIn);
    return () => clearTimeout(timer);
  }, [refreshSession, session]);

  const value = useMemo(
    () => ({session, isHydrating, setSession: storeSession, clearSession}),
    [clearSession, isHydrating, session, storeSession],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error('useSession must be used inside SessionProvider');
  }
  return value;
}

function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt).getTime() <= Date.now();
}

function isExpiring(expiresAt: string): boolean {
  return new Date(expiresAt).getTime() <= Date.now() + REFRESH_EARLY_MS;
}

function isValidSession(value: AuthenticatedSession): boolean {
  return Boolean(
    value?.userId
      && value?.user?.id
      && value?.tokens?.accessToken
      && value?.tokens?.refreshToken
      && value?.tokens?.accessTokenExpiresAt
      && value?.tokens?.refreshTokenExpiresAt,
  );
}
