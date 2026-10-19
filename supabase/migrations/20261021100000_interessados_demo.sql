-- =====================================================================
-- FRANKKIA — Interessados (formulário de apresentação) e demonstração só por link liberado
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Interessados: donos de imobiliária que pediram uma apresentação
--    Qualquer visitante pode ENVIAR; só a equipe Frankkia LÊ e altera.
-- ---------------------------------------------------------------------
create table public.interessados (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null check (length(trim(nome)) between 2 and 120),
  imobiliaria text not null check (length(trim(imobiliaria)) between 2 and 160),
  email       text not null check (length(email) <= 200 and email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$'),
  telefone    text not null check (length(regexp_replace(telefone, '\D', '', 'g')) between 10 and 13),
  equipe      text check (equipe is null or length(equipe) <= 60),
  mensagem    text check (mensagem is null or length(mensagem) <= 2000),
  origem      text not null default 'site' check (origem in ('site','login','pagina')),
  status      text not null default 'novo' check (status in ('novo','em_contato','demo_liberada','cliente','descartado')),
  observacao  text check (observacao is null or length(observacao) <= 2000),
  criado_em   timestamptz not null default now(),
  atualizado_em timestamptz
);
create index interessados_criado_idx on public.interessados (criado_em desc);

alter table public.interessados enable row level security;

create policy interessados_envio on public.interessados for insert to anon, authenticated
  with check (status = 'novo' and observacao is null and atualizado_em is null);
create policy interessados_leitura on public.interessados for select to authenticated using (public.is_frankkia());
create policy interessados_edicao on public.interessados for update to authenticated
  using (public.is_frankkia()) with check (public.is_frankkia());
create policy interessados_exclusao on public.interessados for delete to authenticated using (public.is_frankkia());

-- Freio contra envios repetidos (robôs): no máximo 3 pedidos por e-mail por hora e 30 por hora no total
create or replace function public.limitar_interessados()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.interessados where lower(email) = lower(new.email) and criado_em > now() - interval '1 hour') >= 3
     or (select count(*) from public.interessados where criado_em > now() - interval '1 hour') >= 30 then
    raise exception 'MUITOS_ENVIOS' using errcode = 'P0001';
  end if;
  new.email := lower(trim(new.email));
  return new;
end $$;
create trigger interessados_limite before insert on public.interessados
  for each row execute function public.limitar_interessados();

-- ---------------------------------------------------------------------
-- 2. Acessos à demonstração: links que só a Frankkia cria, com prazo de validade
-- ---------------------------------------------------------------------
create table public.acessos_demo (
  id             uuid primary key default gen_random_uuid(),
  interessado_id uuid references public.interessados(id) on delete set null,
  nome           text not null check (length(trim(nome)) between 1 and 160),
  token          text not null unique check (length(token) >= 24),
  expira_em      timestamptz not null,
  revogado       boolean not null default false,
  usos           int not null default 0,
  ultimo_uso     timestamptz,
  criado_por     uuid references auth.users(id) on delete set null,
  criado_em      timestamptz not null default now()
);

alter table public.acessos_demo enable row level security;
create policy acessos_demo_frankkia on public.acessos_demo for all to authenticated
  using (public.is_frankkia()) with check (public.is_frankkia());

-- Abre a demonstração: confere o link e devolve até quando vale (ou nada, se inválido/vencido)
create or replace function public.validar_demo(p_token text)
returns timestamptz language plpgsql security definer set search_path = public as $$
declare v_ate timestamptz;
begin
  update public.acessos_demo
     set usos = usos + 1, ultimo_uso = now()
   where token = p_token and not revogado and expira_em > now()
  returning expira_em into v_ate;
  return v_ate;
end $$;

revoke execute on function public.validar_demo(text) from public;
grant execute on function public.validar_demo(text) to anon, authenticated;
revoke execute on function public.limitar_interessados() from public, anon, authenticated;
