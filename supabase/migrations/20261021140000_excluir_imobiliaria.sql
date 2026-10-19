-- =====================================================================
-- FRANKKIA — Excluir imobiliária (painel Frankkia)
-- Apaga a imobiliária e tudo dela (equipe, leads, imóveis, vendas, agenda, Academy, chamados, pedidos)
-- e as contas de quem só fazia parte dela. Não tem volta: exige digitar o nome da imobiliária.
-- =====================================================================
create or replace function public.excluir_imobiliaria(p_imob uuid, p_confirmacao text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_nome    text;
  v_contas  uuid[];
begin
  if not public.is_frankkia() then raise exception 'APENAS_FRANKKIA' using errcode = '42501'; end if;
  select nome into v_nome from public.imobiliarias where id = p_imob;
  if not found then raise exception 'IMOBILIARIA_NAO_ENCONTRADA' using errcode = 'P0002'; end if;
  if lower(trim(coalesce(p_confirmacao, ''))) <> lower(trim(v_nome)) then
    raise exception 'CONFIRMACAO_INVALIDA' using errcode = 'P0001';
  end if;

  -- Contas que só pertencem a esta imobiliária (nunca a equipe Frankkia)
  select coalesce(array_agg(m.usuario_id), '{}') into v_contas
  from public.membros m
  where m.imobiliaria_id = p_imob
    and not exists (select 1 from public.membros o where o.usuario_id = m.usuario_id and o.imobiliaria_id <> p_imob)
    and not exists (select 1 from public.frankkia_admins f where f.usuario_id = m.usuario_id);

  delete from public.imobiliarias where id = p_imob;  -- apaga em cascata os dados da imobiliária
  delete from auth.users where id = any (v_contas);
end $$;

revoke execute on function public.excluir_imobiliaria(uuid, text) from public, anon;
grant execute on function public.excluir_imobiliaria(uuid, text) to authenticated;
