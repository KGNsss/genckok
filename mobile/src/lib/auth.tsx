// Oturum yönetimi. Sahibi: Görev 1.
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

type AuthState = { session: Session | null; userId: string | null; loading: boolean };

const AuthContext = createContext<AuthState>({ session: null, userId: null, loading: true });

/** QueryClientProvider'ın İÇİNDE olmalı (çıkışta önbelleği temizler). */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    // 1) İlk açılışta kayıtlı oturumu oku
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setSession(data.session);
      setLoading(false);
    });
    // 2) Sonraki değişiklikleri dinle
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      setLoading(false);
      // Başka kullanıcının verisi görünmesin
      if (event === 'SIGNED_OUT') queryClient.clear();
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [queryClient]);

  const value = useMemo<AuthState>(() => ({ session, userId: session?.user.id ?? null, loading }), [session, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useSession = () => useContext(AuthContext);
