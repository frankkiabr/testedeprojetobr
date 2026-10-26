-- =====================================================================
-- FRANKKIA — Cadastro sem falar com ninguém (/cadastro): a pessoa cria a conta e já entra em teste grátis.
-- Antes só a Frankkia criava imobiliárias (criar_imobiliaria + convite). O fluxo antigo continua valendo.
-- Proteções: e-mail confirmado, uma conta por usuário, um teste por e-mail, WhatsApp e CRECI,
-- e um limite de cadastros por dia. A Frankkia vê cada cadastro em "Interessados".
-- =====================================================================

-- Dias de teste grátis no cadastro pelo site (a Frankkia continua escolhendo à mão nas contas que ela cria)
create table if not exists public.config_cadastro (
  id          boolean primary key default true check (id),
  teste_dias  int not null default 7 check (teste_dias between 1 and 60),
  limite_dia  int not null default 30 check (limite_dia between 1 and 1000),
  aberto      boolean not null default true
);
insert into public.config_cadastro (id) values (true) on conflict do nothing;
alter table public.config_cadastro enable row level security;
drop policy if exists config_cadastro_frankkia on public.config_cadastro;
create policy config_cadastro_frankkia on public.config_cadastro for all to authenticated
  using (public.is_frankkia()) with check (public.is_frankkia());

-- Quem já usou o teste grátis (para não repetir com outro e-mail)
create table if not exists public.testes_gratis (
  id             uuid primary key default gen_random_uuid(),
  email          text not null,
  telefone       text not null,
  creci          text,
  imobiliaria_id uuid references public.imobiliarias(id) on delete set null,
  criado_em      timestamptz not null default now()
);
create index if not exists testes_gratis_email_idx on public.testes_gratis (lower(email));
create index if not exists testes_gratis_tel_idx on public.testes_gratis (telefone);
create index if not exists testes_gratis_creci_idx on public.testes_gratis (creci);
alter table public.testes_gratis enable row level security;
drop policy if exists testes_gratis_frankkia on public.testes_gratis;
create policy testes_gratis_frankkia on public.testes_gratis for select to authenticated using (public.is_frankkia());

-- Origem nova em Interessados
alter table public.interessados drop constraint if exists interessados_origem_check;
alter table public.interessados add constraint interessados_origem_check check (origem in ('site','login','pagina','cadastro'));

create or replace function public.criar_conta_teste(
  p_plano text, p_imobiliaria text, p_cidade text, p_nome text, p_telefone text, p_creci text, p_creci_uf text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_email     text;
  v_conf      timestamptz;
  v_cfg       public.config_cadastro%rowtype;
  v_limite    int;
  v_imob      uuid;
  v_nome      text := trim(coalesce(p_nome, ''));
  v_tel       text := regexp_replace(coalesce(p_telefone, ''), '\D', '', 'g');
  v_creci     text := nullif(upper(regexp_replace(coalesce(p_creci, ''), '\s', '', 'g')), '');
  v_creci_uf  text := upper(nullif(trim(coalesce(p_creci_uf, '')), ''));
  v_nome_imob text := trim(coalesce(p_imobiliaria, ''));
begin
  if auth.uid() is null then raise exception 'NAO_AUTENTICADO' using errcode = '42501'; end if;
  select email, email_confirmed_at into v_email, v_conf from auth.users where id = auth.uid();
  if v_conf is null then raise exception 'EMAIL_NAO_CONFIRMADO' using errcode = '42501'; end if;

  select * into v_cfg from public.config_cadastro where id;
  if not coalesce(v_cfg.aberto, false) then raise exception 'CADASTRO_FECHADO' using errcode = 'P0001'; end if;

  if public.is_frankkia() or exists (select 1 from public.membros where usuario_id = auth.uid()) then
    raise exception 'JA_TEM_CONTA' using errcode = 'P0001';
  end if;

  select limite into v_limite from public.planos where nome = p_plano;
  if not found then raise exception 'PLANO_INVALIDO' using errcode = 'P0001'; end if;

  if array_length(regexp_split_to_array(v_nome, '\s+'), 1) < 2 or length(v_nome) > 120 then
    raise exception 'NOME_INVALIDO' using errcode = 'P0001';
  end if;
  if length(v_tel) not between 12 and 13 then raise exception 'TELEFONE_INVALIDO' using errcode = 'P0001'; end if;
  -- Solo: o dono da conta é o próprio corretor, então o CRECI é obrigatório
  if p_plano = 'Solo' then
    if v_creci is null or length(v_creci) < 3 or v_creci_uf is null then raise exception 'CRECI_OBRIGATORIO' using errcode = 'P0001'; end if;
    v_nome_imob := v_nome;
  end if;
  if length(v_nome_imob) not between 2 and 160 then raise exception 'IMOBILIARIA_INVALIDA' using errcode = 'P0001'; end if;

  if exists (select 1 from public.testes_gratis t
              where lower(t.email) = lower(v_email) or t.telefone = v_tel
                 or (v_creci is not null and t.creci = v_creci || '/' || v_creci_uf)) then
    raise exception 'TESTE_JA_USADO' using errcode = 'P0001';
  end if;
  if (select count(*) from public.testes_gratis where criado_em > now() - interval '1 day') >= v_cfg.limite_dia then
    raise exception 'CADASTRO_LIMITE_DIA' using errcode = 'P0001';
  end if;

  perform set_config('frankkia.operacao_sistema', 'on', true);
  insert into public.imobiliarias (nome, email, telefone, cidade, plano, limite_corretores, status, teste_dias, teste_ate)
  values (v_nome_imob, lower(v_email), v_tel, nullif(trim(coalesce(p_cidade, '')), ''), p_plano, v_limite, 'teste', v_cfg.teste_dias,
          now() + make_interval(days => v_cfg.teste_dias))
  returning id into v_imob;

  update public.perfis set
    nome = v_nome,
    telefone = v_tel,
    creci = v_creci,
    creci_uf = case when v_creci is null then null else v_creci_uf end,
    estagiario = false,
    iniciais = upper(left(split_part(v_nome, ' ', 1), 1) || left(split_part(v_nome, ' ', 2), 1))
  where id = auth.uid();
  insert into public.membros (imobiliaria_id, usuario_id, papel) values (v_imob, auth.uid(), 'admin');
  perform set_config('frankkia.operacao_sistema', 'off', true);

  insert into public.testes_gratis (email, telefone, creci, imobiliaria_id)
  values (lower(v_email), v_tel, case when v_creci is null then null else v_creci || '/' || v_creci_uf end, v_imob);

  -- Aviso para a Frankkia (aparece em Interessados, com o WhatsApp para chamar a pessoa)
  insert into public.interessados (nome, imobiliaria, email, telefone, equipe, mensagem, origem, status)
  values (v_nome, v_nome_imob, lower(v_email), v_tel, p_plano,
          'Criou a conta sozinho pelo site e está no teste grátis de ' || v_cfg.teste_dias || ' dias (plano ' || p_plano || ').',
          'cadastro', 'novo');

  return v_imob;
end $$;
revoke execute on function public.criar_conta_teste(text, text, text, text, text, text, text) from public, anon;
grant execute on function public.criar_conta_teste(text, text, text, text, text, text, text) to authenticated;
