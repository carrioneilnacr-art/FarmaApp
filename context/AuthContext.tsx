import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

type Role = 'administrador' | 'trabajador' | null;
type AuthState = { session: Session | null; role: Role; loading: boolean; signIn: (id: string, password: string) => Promise<string | null>; signOut: () => Promise<void> };
const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => { setSession(next); setLoading(false); });
    return () => listener.subscription.unsubscribe();
  }, []);
  const roleValue = session?.user.app_metadata?.farmaapp_role;
  const role: Role = roleValue === 'administrador' || roleValue === 'trabajador' ? roleValue : null;
  const signIn = async (id: string, password: string) => {
    const normalized = id.trim().toLocaleLowerCase();
    if (normalized !== 'administrador' && normalized !== 'trabajador') return 'ID no válido.';
    const { error } = await supabase.auth.signInWithPassword({ email: `${normalized}@farmaapp.invalid`, password });
    return error ? 'ID o contraseña incorrectos. Comprueba tu conexión e inténtalo otra vez.' : null;
  };
  const signOut = async () => { await supabase.auth.signOut(); };
  return <AuthContext.Provider value={{ session, role, loading, signIn, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthProvider faltante');
  return value;
}
