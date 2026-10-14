import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export function SignOutButton() {
 const queryClient = useQueryClient(); const navigate = useNavigate();
 const [busy, setBusy] = useState(false); const [error, setError] = useState('');
 async function signOut() {
  setBusy(true); setError(''); await queryClient.cancelQueries(); queryClient.clear();
  const { error: failure } = await supabase.auth.signOut();
  if (failure) { setError('Não foi possível sair. Tente novamente.'); setBusy(false); return; }
  await navigate({ to: '/login', replace: true });
 }
 return <><Button variant="outline" onClick={signOut} disabled={busy}><LogOut/>{busy ? 'Saindo…' : 'Sair'}</Button>{error && <p role="alert">{error}</p>}</>;
}