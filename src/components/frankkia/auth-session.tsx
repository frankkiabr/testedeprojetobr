import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { useRouter } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const SessionContext = createContext<{ user: User | null; loading: boolean }>({ user: null, loading: true });
export function useFrankkiaSession() { return useContext(SessionContext); }
export function SessionProvider({ children }: { children: ReactNode }) {
 const [state, setState] = useState<{ user: User | null; loading: boolean }>({ user: null, loading: true });
 const router = useRouter();
 const queryClient = useQueryClient();
 useEffect(() => {
  let alive = true;
  let revision = 0;
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
   if (!['SIGNED_IN','SIGNED_OUT','USER_UPDATED','PASSWORD_RECOVERY'].includes(event)) return;
   revision++;
   if (alive) setState({ user: session?.user ?? null, loading: false });
   if (event === 'SIGNED_OUT') { queryClient.clear(); }
   void router.invalidate();
   if (event !== 'SIGNED_OUT') void queryClient.invalidateQueries();
  });
  const startRevision = revision;
  void supabase.auth.getUser().then(({ data }) => { if (alive && revision === startRevision) setState({ user: data.user, loading: false }); });
  return () => { alive = false; subscription.unsubscribe(); };
 }, [router, queryClient]);
 return <SessionContext.Provider value={state}>{children}</SessionContext.Provider>;
}