import React, {PropsWithChildren, createContext, useContext, useMemo, useState} from 'react';
import {AuthenticatedSession} from './sessionTypes';

type SessionContextValue = {
  session?: AuthenticatedSession;
  setSession: (session: AuthenticatedSession) => void;
  clearSession: () => void;
};

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({children}: PropsWithChildren): React.JSX.Element {
  const [session, setSessionState] = useState<AuthenticatedSession | undefined>();

  const value = useMemo(
    () => ({
      session,
      setSession: setSessionState,
      clearSession: () => setSessionState(undefined),
    }),
    [session],
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
