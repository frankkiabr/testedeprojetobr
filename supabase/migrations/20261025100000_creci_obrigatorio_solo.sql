-- =====================================================================
-- FRANKKIA — CRECI obrigatório no plano Solo (cadastro e perfil)
-- =====================================================================

-- Convite: diz se a conta é Solo (a tela de primeiro acesso pede o CRECI)
drop function if exists public.ver_convite(text);
create function public.ver_convite(p_token text)
returns table (email text, imobiliaria text, papel text, solo boolean)
language sql stable security definer set search_path = public as $$
  select c.email, i.nome, c.papel, i.plano = 'Solo'
  from public.convites c join public.imobiliarias i on i.id = c.imobiliaria_id
  where c.token = p_token and c.status = 'pendente';
$$;
revoke execute on function public.ver_convite(text) from public;
grant execute on function public.ver_convite(text) to anon, authenticated;

-- Primeiro acesso
create or replace function public.aceitar_convite(
  p_token text, p_nome text, p_telefone text, p_aniversario date,
  p_creci text, p_creci_uf text, p_estagiario boolean)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  c        public.convites%rowtype;
  v_email  text;
  v_nome   text := trim(coalesce(p_nome, ''));
begin
  if auth.uid() is null then raise exception 'NAO_AUTENTICADO' using errcode = '42501'; end if;
  select * into c from public.convites where token = p_token and status = 'pendente' for update;
  if not found then raise exception 'CONVITE_INVALIDO' using errcode = 'P0002'; end if;
  select email into v_email from auth.users where id = auth.uid();
  if lower(v_email) <> lower(c.email) then raise exception 'EMAIL_DIFERENTE_DO_CONVITE' using errcode = '42501'; end if;
  if c.papel = 'corretor' and not coalesce(p_estagiario, false) and coalesce(trim(p_creci), '') = '' then
    raise exception 'CRECI_OBRIGATORIO' using errcode = 'P0001';
  end if;
  -- Solo: o dono da conta é o próprio corretor, então o CRECI é obrigatório (sem a opção de estagiário)
  if (select plano from public.imobiliarias where id = c.imobiliaria_id) = 'Solo' then
    if coalesce(trim(p_creci), '') = '' then raise exception 'CRECI_OBRIGATORIO' using errcode = 'P0001'; end if;
    p_estagiario := false;
  end if;

  update public.convites set status = 'aceito', aceito_por = auth.uid() where id = c.id;
  update public.perfis set
    nome = v_nome,
    telefone = nullif(trim(p_telefone), ''),
    aniversario = p_aniversario,
    creci = nullif(trim(p_creci), ''),
    creci_uf = case when nullif(trim(p_creci), '') is null then null else upper(p_creci_uf) end,
    estagiario = coalesce(p_estagiario, false),
    iniciais = upper(left(split_part(v_nome, ' ', 1), 1) || left(split_part(v_nome, ' ', 2), 1))
  where id = auth.uid();
  insert into public.membros (imobiliaria_id, usuario_id, papel)
  values (c.imobiliaria_id, auth.uid(), c.papel)
  on conflict (imobiliaria_id, usuario_id) do update set ativo = true, papel = excluded.papel;
  if c.papel = 'admin' then
    perform set_config('frankkia.operacao_sistema', 'on', true);
    update public.imobiliarias
       set status = case when teste_dias is not null then 'teste' else 'ativa' end,
           teste_ate = case when teste_dias is not null then now() + make_interval(days => teste_dias) else null end
     where id = c.imobiliaria_id and status = 'aguardando';
    perform set_config('frankkia.operacao_sistema', 'off', true);
  end if;
  return c.imobiliaria_id;
end $$;


-- Perfil: corretor de equipe precisa de CRECI (ou ser estagiário); no Solo, sempre
create or replace function public.checar_creci()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(trim(new.creci), '') = '' and (
       (not new.estagiario and exists (select 1 from public.membros where usuario_id = new.id and papel = 'corretor' and ativo))
       or exists (select 1 from public.membros m join public.imobiliarias i on i.id = m.imobiliaria_id
                   where m.usuario_id = new.id and m.ativo and i.plano = 'Solo')) then
    raise exception 'CRECI_OBRIGATORIO: informe o CRECI' using errcode = 'P0001';
  end if;
  return new;
end $$;
