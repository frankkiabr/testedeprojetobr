-- =====================================================================
-- FRANKKIA — Teste grátis pelo site só nos planos Solo, Equipe 5 e Equipe 10. Equipe 30 e 60 começam por uma
-- conversa com o Luiz (WhatsApp); a Frankkia ainda pode criar um teste desses pelo painel.
-- =====================================================================
create or replace function public.teste_so_planos_menores()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'teste' and new.plano in ('Equipe 30', 'Equipe 60') and not public.is_frankkia() then
    raise exception 'PLANO_COM_CONVERSA: o teste do plano % é combinado com a Frankkia pelo WhatsApp', new.plano using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists imobiliarias_teste_planos on public.imobiliarias;
create trigger imobiliarias_teste_planos before insert on public.imobiliarias
  for each row execute function public.teste_so_planos_menores();
revoke execute on function public.teste_so_planos_menores() from public, anon, authenticated;
