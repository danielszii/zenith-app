import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { clearSession, getSession, login as authenticate, Session } from '../services/api';
type AuthValue = { session: Session | null; loading: boolean; signIn: (email: string, password: string, url: string) => Promise<void>; signOut: () => Promise<void> };
const AuthContext = createContext<AuthValue | null>(null);
export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null); const [loading, setLoading] = useState(true);
  useEffect(() => { getSession().then(setSession).finally(() => setLoading(false)); }, []);
  const value = useMemo<AuthValue>(() => ({ session, loading, signIn: async (email, password, url) => setSession(await authenticate(email, password, url)), signOut: async () => { await clearSession(); setSession(null); } }), [session, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth = () => { const value = useContext(AuthContext); if (!value) throw new Error('AuthProvider ausente'); return value; };
