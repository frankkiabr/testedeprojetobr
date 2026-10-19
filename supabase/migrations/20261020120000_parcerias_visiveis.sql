-- =====================================================================
-- FRANKKIA — Etapa 3: ajustes para as telas usarem o banco
-- =====================================================================

-- O corretor que participou de uma venda/locação em parceria passa a ver a captação daquele negócio
-- (para a venda aparecer com o nome do imóvel). Leads e proprietários do colega continuam privados.
create policy captacoes_participante on public.captacoes for select to authenticated
  using (public.is_member(imobiliaria_id) and exists (
    select 1 from public.transacoes t
    join public.transacao_participantes p on p.transacao_id = t.id
    where t.captacao_id = captacoes.id and p.corretor_id = auth.uid()));

-- Soma das partes de cada negócio em que o corretor participa (sem revelar as partes dos outros).
-- Serve para calcular o VGV proporcional dele nas parcerias.
create or replace function public.minhas_participacoes(p_imob uuid)
returns table (transacao_id uuid, soma_pct numeric)
language sql stable security definer set search_path = public as $$
  select tp.transacao_id, sum(tp.pct)
  from public.transacao_participantes tp
  where tp.imobiliaria_id = p_imob and public.is_member(p_imob)
    and exists (select 1 from public.transacao_participantes eu
                where eu.transacao_id = tp.transacao_id and eu.corretor_id = auth.uid())
  group by tp.transacao_id;
$$;
revoke execute on function public.minhas_participacoes(uuid) from public, anon;
grant execute on function public.minhas_participacoes(uuid) to authenticated;
