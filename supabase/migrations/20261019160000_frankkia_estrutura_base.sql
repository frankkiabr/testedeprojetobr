-- =====================================================================
-- FRANKKIA — Etapa 1: estrutura do banco e regras de segurança (RLS)
--
-- Regras de negócio garantidas aqui (e não só na tela):
--   • Cada imobiliária só enxerga os próprios dados.
--   • Corretor vê/edita só os próprios leads, captações, proprietários e agenda.
--   • Administrador vê/edita tudo da própria imobiliária.
--   • Só o administrador registra vendas e locações (o corretor só "informa o fechamento").
--   • Comissão (divisão dos honorários) só é visível ao administrador e a quem participou.
--   • Equipe Frankkia vê contas, planos, upgrades, chamados e erros — nunca dados internos.
--   • Limite de vagas do plano (corretores ativos + convites pendentes) travado no banco.
--   • Só a Frankkia muda plano, limite e status de uma imobiliária.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Catálogo de planos
-- ---------------------------------------------------------------------
create table public.planos (
  nome    text primary key,
  limite  int  not null check (limite > 0),
  preco   numeric(10,2) not null check (preco >= 0),
  ordem   int  not null
);
insert into public.planos (nome, limite, preco, ordem) values
  ('Equipe 15', 15,  999.00, 1),
  ('Equipe 30', 30, 1699.00, 2),
  ('Equipe 60', 60, 2999.00, 3);

-- ---------------------------------------------------------------------
-- 2. Imobiliárias, perfis e membros
-- ---------------------------------------------------------------------
create table public.imobiliarias (
  id                uuid primary key default gen_random_uuid(),
  nome              text not null check (length(trim(nome)) > 0),
  cnpj              text,
  email             text,
  telefone          text,
  cidade            text,
  plano             text not null default 'Equipe 15' references public.planos(nome),
  limite_corretores int  not null default 15 check (limite_corretores > 0),
  meta_mensal_vgv   numeric(14,2) not null default 0 check (meta_mensal_vgv >= 0),
  status            text not null default 'aguardando'
                    check (status in ('ativa','teste','pagamento','suspensa','aguardando')),
  cliente_desde     timestamptz not null default now(),
  ultimo_acesso     timestamptz,
  criado_em         timestamptz not null default now()
);

create table public.perfis (
  id          uuid primary key references auth.users(id) on delete cascade,
  nome        text not null default '',
  email       text not null default '',
  telefone    text,
  iniciais    text not null default '',
  aniversario date,
  creci       text,
  creci_uf    text check (creci_uf is null or length(creci_uf) = 2),
  estagiario  boolean not null default false,
  criado_em   timestamptz not null default now()
);

create table public.membros (
  id              uuid primary key default gen_random_uuid(),
  imobiliaria_id  uuid not null references public.imobiliarias(id) on delete cascade,
  usuario_id      uuid not null references auth.users(id) on delete cascade,
  papel           text not null check (papel in ('admin','corretor')),
  ativo           boolean not null default true,
  meta_mensal_vgv numeric(14,2) check (meta_mensal_vgv is null or meta_mensal_vgv >= 0),
  criado_em       timestamptz not null default now(),
  unique (imobiliaria_id, usuario_id)
);
create index membros_usuario_idx on public.membros (usuario_id);

-- Equipe Frankkia (painel do criador)
create table public.frankkia_admins (
  usuario_id uuid primary key references auth.users(id) on delete cascade,
  criado_em  timestamptz not null default now()
);
-- E-mails que viram Frankkia automaticamente ao confirmar o cadastro
create table public.frankkia_emails_autorizados (
  email text primary key
);
insert into public.frankkia_emails_autorizados (email) values ('frankkiabr@gmail.com');

create table public.convites (
  id             uuid primary key default gen_random_uuid(),
  imobiliaria_id uuid not null references public.imobiliarias(id) on delete cascade,
  email          text not null check (position('@' in email) > 1),
  papel          text not null default 'corretor' check (papel in ('admin','corretor')),
  token          text not null unique default encode(extensions.gen_random_bytes(24), 'hex'),
  status         text not null default 'pendente' check (status in ('pendente','aceito','cancelado')),
  enviado_em     timestamptz not null default now(),
  criado_por     uuid references auth.users(id) on delete set null,
  aceito_por     uuid references auth.users(id) on delete set null
);
create unique index convites_pendente_unico on public.convites (imobiliaria_id, lower(email)) where status = 'pendente';

-- ---------------------------------------------------------------------
-- 3. Negócios
-- ---------------------------------------------------------------------
create table public.parceiros (
  id             uuid primary key default gen_random_uuid(),
  imobiliaria_id uuid not null references public.imobiliarias(id) on delete cascade,
  nome           text not null check (length(trim(nome)) > 0),
  creci          text,
  empresa        text,
  telefone       text,
  criado_em      timestamptz not null default now(),
  unique (imobiliaria_id, id)
);

create table public.leads (
  id             uuid primary key default gen_random_uuid(),
  imobiliaria_id uuid not null references public.imobiliarias(id) on delete cascade,
  corretor_id    uuid not null references auth.users(id),
  nome           text not null check (length(trim(nome)) > 0),
  telefone       text not null,
  origem         text not null default 'Site',
  interesse      text not null default '',
  etapa          text not null default 'novo'
                 check (etapa in ('novo','contato','visita','proposta','fechado','perdido')),
  checklist      boolean[] not null default array[false,false,false,false,false,false],
  visita_em      timestamptz,
  observacoes    text,
  criado_em      timestamptz not null default now()
);
create index leads_dono_idx on public.leads (imobiliaria_id, corretor_id, criado_em desc);

create table public.proprietarios (
  id             uuid primary key default gen_random_uuid(),
  imobiliaria_id uuid not null references public.imobiliarias(id) on delete cascade,
  corretor_id    uuid not null references auth.users(id),
  nome           text not null check (length(trim(nome)) > 0),
  whatsapp       text not null,
  criado_em      timestamptz not null default now(),
  unique (imobiliaria_id, id)
);
create index proprietarios_dono_idx on public.proprietarios (imobiliaria_id, corretor_id);

-- Imóvel = lugar físico (compartilhado por toda a imobiliária)
create table public.imoveis (
  id             uuid primary key default gen_random_uuid(),
  imobiliaria_id uuid not null references public.imobiliarias(id) on delete cascade,
  categoria      text not null check (categoria in ('Apartamento','Casa','Sala comercial','Loja','Galpão','Terreno')),
  nome           text,
  logradouro     text not null,
  numero         text not null,
  bairro         text not null,
  cidade         text not null,
  uf             text not null check (length(uf) = 2),
  criado_por     uuid references auth.users(id) on delete set null,
  criado_em      timestamptz not null default now(),
  unique (imobiliaria_id, id)
);
create index imoveis_imob_idx on public.imoveis (imobiliaria_id, categoria);

-- Captação = oferta de um imóvel (venda ou locação)
create table public.captacoes (
  id                  uuid primary key default gen_random_uuid(),
  imobiliaria_id      uuid not null references public.imobiliarias(id) on delete cascade,
  corretor_id         uuid not null references auth.users(id),
  proprietario_id     uuid not null,
  imovel_id           uuid not null,
  unidade             text,
  finalidade          text not null check (finalidade in ('venda','locacao')),
  valor               numeric(14,2) not null check (valor > 0),
  area_m2             numeric(10,2) not null check (area_m2 > 0),
  status              text not null default 'ativa' check (status in ('ativa','vendida','alugada')),
  captado_em          timestamptz not null default now(),
  checklist_captacao  boolean[] not null default array[false,false,false,false,false,false,false],
  checklist_marketing boolean[] not null default array[false,false,false,false,false,false,false,false],
  unique (imobiliaria_id, id),
  foreign key (imobiliaria_id, proprietario_id) references public.proprietarios (imobiliaria_id, id),
  foreign key (imobiliaria_id, imovel_id)       references public.imoveis (imobiliaria_id, id)
);
create index captacoes_dono_idx on public.captacoes (imobiliaria_id, corretor_id, captado_em desc);

-- Transação (dados de mercado: visíveis a toda a imobiliária, sem nomes nem comissões)
create table public.transacoes (
  id             uuid primary key default gen_random_uuid(),
  imobiliaria_id uuid not null references public.imobiliarias(id) on delete cascade,
  tipo           text not null check (tipo in ('venda','locacao')),
  captacao_id    uuid not null,
  valor          numeric(14,2) not null check (valor > 0),
  data           timestamptz not null default now(),
  registrado_por uuid references auth.users(id) on delete set null,
  criado_em      timestamptz not null default now(),
  unique (imobiliaria_id, id),
  foreign key (imobiliaria_id, captacao_id) references public.captacoes (imobiliaria_id, id)
);
create index transacoes_data_idx on public.transacoes (imobiliaria_id, data desc);

-- Detalhes sensíveis da transação (honorários e cliente)
create table public.transacao_detalhes (
  transacao_id   uuid primary key,
  imobiliaria_id uuid not null,
  honorarios_pct numeric(6,2) not null check (honorarios_pct > 0 and honorarios_pct <= 100),
  cliente        text,
  foreign key (imobiliaria_id, transacao_id) references public.transacoes (imobiliaria_id, id) on delete cascade
);

-- Divisão dos honorários (comissões)
create table public.transacao_participantes (
  id             uuid primary key default gen_random_uuid(),
  imobiliaria_id uuid not null,
  transacao_id   uuid not null,
  tipo           text not null check (tipo in ('corretor','parceiro')),
  corretor_id    uuid references auth.users(id),
  parceiro_id    uuid,
  pct            numeric(6,2) not null check (pct > 0 and pct <= 100),
  check ((tipo = 'corretor' and corretor_id is not null and parceiro_id is null)
      or (tipo = 'parceiro' and parceiro_id is not null and corretor_id is null)),
  foreign key (imobiliaria_id, transacao_id) references public.transacoes (imobiliaria_id, id) on delete cascade,
  foreign key (imobiliaria_id, parceiro_id)  references public.parceiros (imobiliaria_id, id)
);
create index participantes_transacao_idx on public.transacao_participantes (transacao_id);
create index participantes_corretor_idx  on public.transacao_participantes (imobiliaria_id, corretor_id);

create table public.fechamentos_informados (
  id             uuid primary key default gen_random_uuid(),
  imobiliaria_id uuid not null references public.imobiliarias(id) on delete cascade,
  corretor_id    uuid not null references auth.users(id),
  captacao_id    uuid not null,
  tipo           text not null check (tipo in ('venda','locacao')),
  valor          numeric(14,2) not null check (valor > 0),
  data           timestamptz not null,
  observacao     text,
  status         text not null default 'pendente' check (status in ('pendente','registrado','descartado')),
  criado_em      timestamptz not null default now(),
  foreign key (imobiliaria_id, captacao_id) references public.captacoes (imobiliaria_id, id)
);

-- ---------------------------------------------------------------------
-- 4. Agenda
-- ---------------------------------------------------------------------
create table public.compromissos (
  id             uuid primary key default gen_random_uuid(),
  imobiliaria_id uuid references public.imobiliarias(id) on delete cascade,  -- nulo = agenda da Frankkia
  dono_id        uuid not null references auth.users(id) on delete cascade,
  titulo         text not null check (length(trim(titulo)) > 0),
  tipo           text not null check (tipo in ('visita','captacao','reuniao','ligacao','outro')),
  inicio         timestamptz not null,
  fim            timestamptz not null,
  lead_id        uuid references public.leads(id) on delete set null,
  captacao_id    uuid references public.captacoes(id) on delete set null,
  local          text,
  observacoes    text,
  criado_em      timestamptz not null default now(),
  check (fim > inicio)
);
create index compromissos_dono_idx on public.compromissos (dono_id, inicio);
create index compromissos_imob_idx on public.compromissos (imobiliaria_id, inicio);

-- ---------------------------------------------------------------------
-- 5. Academy e Marketing
-- ---------------------------------------------------------------------
create table public.trilhas (
  id             uuid primary key default gen_random_uuid(),
  imobiliaria_id uuid not null references public.imobiliarias(id) on delete cascade,
  titulo         text not null check (length(trim(titulo)) > 0),
  subtitulo      text not null default '',
  capa_hue       int not null default 226,
  criado_em      timestamptz not null default now()
);

create table public.aulas (
  id             uuid primary key default gen_random_uuid(),
  imobiliaria_id uuid not null references public.imobiliarias(id) on delete cascade,
  trilha_id      uuid not null references public.trilhas(id) on delete cascade,
  titulo         text not null check (length(trim(titulo)) > 0),
  tipo           text not null check (tipo in ('video','documento')),
  formato        text not null check (formato in ('MP4','MOV','PDF','DOC','DOCX')),
  arquivo_nome   text not null,
  tamanho_bytes  bigint not null default 0,
  duracao_min    int,
  arquivo_path   text,
  ordem          int not null default 0,
  criado_em      timestamptz not null default now(),
  check ((tipo = 'video' and formato in ('MP4','MOV')) or (tipo = 'documento' and formato in ('PDF','DOC','DOCX')))
);
create index aulas_trilha_idx on public.aulas (trilha_id, ordem);

create table public.progresso_aulas (
  usuario_id     uuid not null references auth.users(id) on delete cascade,
  aula_id        uuid not null references public.aulas(id) on delete cascade,
  imobiliaria_id uuid not null references public.imobiliarias(id) on delete cascade,
  concluida_em   timestamptz not null default now(),
  primary key (usuario_id, aula_id)
);

create table public.marca_logo (
  imobiliaria_id uuid primary key references public.imobiliarias(id) on delete cascade,
  nome           text not null,
  arquivo_path   text not null,
  tamanho_bytes  bigint not null default 0,
  largura        int,
  altura         int,
  transparente   boolean,
  enviado_em     timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 6. Plataforma (Ajuda, upgrades e erros)
-- ---------------------------------------------------------------------
create table public.chamados (
  id             uuid primary key default gen_random_uuid(),
  imobiliaria_id uuid not null references public.imobiliarias(id) on delete cascade,
  autor_id       uuid not null references auth.users(id) on delete cascade,
  assunto        text not null check (length(trim(assunto)) > 0),
  categoria      text not null,
  mensagem       text not null,
  status         text not null default 'aberto' check (status in ('aberto','em_andamento','resolvido')),
  resposta       text,
  criado_em      timestamptz not null default now(),
  respondido_em  timestamptz
);

create table public.pedidos_upgrade (
  id             uuid primary key default gen_random_uuid(),
  imobiliaria_id uuid not null references public.imobiliarias(id) on delete cascade,
  plano_atual    text not null references public.planos(nome),
  plano_novo     text not null references public.planos(nome),
  valor_mensal   numeric(10,2) not null,
  pagamento      text not null default 'aguardando' check (pagamento in ('aguardando','pendente','confirmado','cancelado')),
  metodo         text check (metodo is null or metodo in ('cartao','pix','boleto')),
  pago_em        timestamptz,
  liberado       boolean not null default false,
  liberado_em    timestamptz,
  referencia     text,
  criado_por     uuid references auth.users(id) on delete set null,
  criado_em      timestamptz not null default now()
);

create table public.erros_sistema (
  id                    uuid primary key default gen_random_uuid(),
  mensagem              text not null,
  local                 text not null,
  ocorrencias           int not null default 1,
  imobiliarias_afetadas uuid[] not null default '{}',
  primeira_vez          timestamptz not null default now(),
  ultima_vez            timestamptz not null default now(),
  status                text not null default 'novo' check (status in ('novo','investigando','corrigido')),
  unique (mensagem, local)
);

-- =====================================================================
-- FUNÇÕES DE APOIO (usadas pelas regras de acesso)
-- security definer: consultam membros sem esbarrar nas próprias regras.
-- =====================================================================
create or replace function public.is_frankkia()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.frankkia_admins where usuario_id = auth.uid());
$$;

-- Membro ativo de uma imobiliária que NÃO está suspensa (acesso aos dados)
create or replace function public.is_member(p_imob uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.membros m join public.imobiliarias i on i.id = m.imobiliaria_id
    where m.imobiliaria_id = p_imob and m.usuario_id = auth.uid() and m.ativo and i.status <> 'suspensa');
$$;

create or replace function public.is_admin(p_imob uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.membros m join public.imobiliarias i on i.id = m.imobiliaria_id
    where m.imobiliaria_id = p_imob and m.usuario_id = auth.uid() and m.ativo and m.papel = 'admin'
      and i.status <> 'suspensa');
$$;

-- Membro ativo, mesmo se a imobiliária estiver suspensa (para ver o aviso e abrir chamado)
create or replace function public.pertence(p_imob uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.membros where imobiliaria_id = p_imob and usuario_id = auth.uid() and ativo);
$$;

-- Um usuário é membro ativo de uma imobiliária?
create or replace function public.is_membro_ativo(p_imob uuid, p_usuario uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.membros where imobiliaria_id = p_imob and usuario_id = p_usuario and ativo);
$$;

-- O usuário logado e p_usuario estão na mesma imobiliária?
create or replace function public.compartilha_imobiliaria(p_usuario uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.membros a join public.membros b on a.imobiliaria_id = b.imobiliaria_id
    where a.usuario_id = auth.uid() and a.ativo and b.usuario_id = p_usuario);
$$;

create or replace function public.vagas_em_uso(p_imob uuid)
returns int language sql stable security definer set search_path = public as $$
  select ((select count(*) from public.membros
           where imobiliaria_id = p_imob and ativo and papel = 'corretor')
        + (select count(*) from public.convites
           where imobiliaria_id = p_imob and status = 'pendente' and papel = 'corretor'))::int;
$$;

-- =====================================================================
-- GATILHOS (regras que valem mesmo fora da tela)
-- =====================================================================

-- Novo usuário → cria o perfil; e-mail autorizado e confirmado → vira Frankkia
create or replace function public.novo_usuario()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_nome text := coalesce(nullif(trim(new.raw_user_meta_data ->> 'nome'), ''), '');
begin
  insert into public.perfis (id, email, nome, iniciais)
  values (new.id, coalesce(new.email, ''), v_nome,
          upper(left(split_part(v_nome, ' ', 1), 1) || left(split_part(v_nome, ' ', 2), 1)))
  on conflict (id) do nothing;
  if new.email_confirmed_at is not null
     and exists (select 1 from public.frankkia_emails_autorizados where lower(email) = lower(new.email)) then
    insert into public.frankkia_admins (usuario_id) values (new.id) on conflict do nothing;
  end if;
  return new;
end $$;

create or replace function public.usuario_confirmado()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.email_confirmed_at is not null and old.email_confirmed_at is null
     and exists (select 1 from public.frankkia_emails_autorizados where lower(email) = lower(new.email)) then
    insert into public.frankkia_admins (usuario_id) values (new.id) on conflict do nothing;
  end if;
  return new;
end $$;

create trigger frankkia_novo_usuario after insert on auth.users
  for each row execute function public.novo_usuario();
create trigger frankkia_usuario_confirmado after update of email_confirmed_at on auth.users
  for each row execute function public.usuario_confirmado();

-- Limite de vagas do plano (corretores ativos + convites pendentes)
create or replace function public.checar_vagas()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_limite int;
begin
  if tg_table_name = 'convites' then
    if new.papel <> 'corretor' or new.status <> 'pendente' then return new; end if;
    if tg_op = 'UPDATE' and old.status = 'pendente' and old.papel = 'corretor' then return new; end if;
  else -- membros
    if new.papel <> 'corretor' or not new.ativo then return new; end if;
    if tg_op = 'UPDATE' and old.ativo and old.papel = 'corretor' then return new; end if;
  end if;
  -- trava a linha da imobiliária para dois convites simultâneos não furarem o limite
  select limite_corretores into v_limite from public.imobiliarias where id = new.imobiliaria_id for update;
  if public.vagas_em_uso(new.imobiliaria_id) >= v_limite then
    raise exception 'LIMITE_DO_PLANO: todas as % vagas do plano estão em uso', v_limite using errcode = 'P0001';
  end if;
  return new;
end $$;

create trigger convites_vagas before insert or update on public.convites
  for each row execute function public.checar_vagas();
create trigger membros_vagas before insert or update on public.membros
  for each row execute function public.checar_vagas();

-- A imobiliária nunca fica sem administrador ativo
create or replace function public.proteger_ultimo_admin()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.papel = 'admin' and old.ativo and (not new.ativo or new.papel <> 'admin') then
    if not exists (select 1 from public.membros
                   where imobiliaria_id = old.imobiliaria_id and papel = 'admin' and ativo and id <> old.id) then
      raise exception 'ULTIMO_ADMIN: a imobiliária precisa de pelo menos um administrador ativo' using errcode = 'P0001';
    end if;
  end if;
  return new;
end $$;
create trigger membros_ultimo_admin before update on public.membros
  for each row execute function public.proteger_ultimo_admin();

-- Plano, limite, status e data de cliente: só a Frankkia altera
create or replace function public.proteger_imobiliaria()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- operações internas do sistema (ex.: aceitar o convite do administrador) passam
  if coalesce(current_setting('frankkia.operacao_sistema', true), '') = 'on' then return new; end if;
  if not public.is_frankkia() and (
       new.plano is distinct from old.plano
    or new.limite_corretores is distinct from old.limite_corretores
    or new.status is distinct from old.status
    or new.cliente_desde is distinct from old.cliente_desde) then
    raise exception 'APENAS_FRANKKIA: plano, limite e status são alterados pela equipe Frankkia' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger imobiliarias_protecao before update on public.imobiliarias
  for each row execute function public.proteger_imobiliaria();

-- Corretor não transfere o próprio registro para outra pessoa (só o administrador)
create or replace function public.proteger_dono()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_col text := tg_argv[0];
begin
  if (to_jsonb(new) ->> v_col) is distinct from (to_jsonb(old) ->> v_col)
     and not public.is_admin(new.imobiliaria_id) then
    raise exception 'APENAS_ADMIN: só o administrador muda o responsável' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger leads_dono        before update on public.leads         for each row execute function public.proteger_dono('corretor_id');
create trigger proprietarios_dono before update on public.proprietarios for each row execute function public.proteger_dono('corretor_id');
create trigger captacoes_dono    before update on public.captacoes     for each row execute function public.proteger_dono('corretor_id');

-- Só o administrador marca uma captação como vendida/alugada
create or replace function public.proteger_status_captacao()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status and not public.is_admin(new.imobiliaria_id) then
    raise exception 'APENAS_ADMIN: só o administrador registra vendas e locações' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger captacoes_status before update on public.captacoes
  for each row execute function public.proteger_status_captacao();

-- A soma das partes dos honorários não passa de 100%
create or replace function public.checar_soma_participantes()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select coalesce(sum(pct), 0) from public.transacao_participantes where transacao_id = new.transacao_id) > 100 then
    raise exception 'SOMA_ACIMA_DE_100: a soma das partes passou de 100%% dos honorários' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger participantes_soma after insert or update on public.transacao_participantes
  for each row execute function public.checar_soma_participantes();

-- Corretor (não estagiário) precisa ter CRECI
create or replace function public.checar_creci()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not new.estagiario and coalesce(trim(new.creci), '') = ''
     and exists (select 1 from public.membros where usuario_id = new.id and papel = 'corretor' and ativo) then
    raise exception 'CRECI_OBRIGATORIO: informe o CRECI ou marque estagiário' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger perfis_creci before update on public.perfis
  for each row execute function public.checar_creci();

-- =====================================================================
-- REGRAS DE ACESSO (RLS)
-- =====================================================================
alter table public.planos                      enable row level security;
alter table public.imobiliarias                enable row level security;
alter table public.perfis                      enable row level security;
alter table public.membros                     enable row level security;
alter table public.frankkia_admins             enable row level security;
alter table public.frankkia_emails_autorizados enable row level security;
alter table public.convites                    enable row level security;
alter table public.parceiros                   enable row level security;
alter table public.leads                       enable row level security;
alter table public.proprietarios               enable row level security;
alter table public.imoveis                     enable row level security;
alter table public.captacoes                   enable row level security;
alter table public.transacoes                  enable row level security;
alter table public.transacao_detalhes          enable row level security;
alter table public.transacao_participantes     enable row level security;
alter table public.fechamentos_informados      enable row level security;
alter table public.compromissos                enable row level security;
alter table public.trilhas                     enable row level security;
alter table public.aulas                       enable row level security;
alter table public.progresso_aulas             enable row level security;
alter table public.marca_logo                  enable row level security;
alter table public.chamados                    enable row level security;
alter table public.pedidos_upgrade             enable row level security;
alter table public.erros_sistema               enable row level security;
-- frankkia_emails_autorizados: sem nenhuma regra = ninguém acessa pelo app.

-- Planos: tabela de preços pública
create policy planos_leitura on public.planos for select to anon, authenticated using (true);

-- Imobiliárias
create policy imob_leitura on public.imobiliarias for select to authenticated
  using (public.pertence(id) or public.is_frankkia());
create policy imob_insercao on public.imobiliarias for insert to authenticated
  with check (public.is_frankkia());
create policy imob_edicao on public.imobiliarias for update to authenticated
  using (public.is_admin(id) or public.is_frankkia())
  with check (public.is_admin(id) or public.is_frankkia());

-- Perfis: o próprio, colegas da mesma imobiliária e a Frankkia
create policy perfis_leitura on public.perfis for select to authenticated
  using (id = auth.uid() or public.compartilha_imobiliaria(id) or public.is_frankkia());
create policy perfis_edicao on public.perfis for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Membros: colegas veem a equipe; administrador ativa/desativa (só colunas permitidas)
create policy membros_leitura on public.membros for select to authenticated
  using (public.pertence(imobiliaria_id) or public.is_frankkia());
create policy membros_edicao on public.membros for update to authenticated
  using (public.is_admin(imobiliaria_id)) with check (public.is_admin(imobiliaria_id));
revoke update on public.membros from authenticated;
grant update (ativo, meta_mensal_vgv) on public.membros to authenticated;

-- Frankkia admins: cada um vê o próprio registro (para saber se é Frankkia)
create policy frankkia_leitura on public.frankkia_admins for select to authenticated
  using (usuario_id = auth.uid() or public.is_frankkia());

-- Convites: administrador da imobiliária (e Frankkia para leitura)
create policy convites_leitura on public.convites for select to authenticated
  using (public.is_admin(imobiliaria_id) or public.is_frankkia());
create policy convites_insercao on public.convites for insert to authenticated
  with check (public.is_admin(imobiliaria_id) and papel = 'corretor' and status = 'pendente' and criado_por = auth.uid());
create policy convites_edicao on public.convites for update to authenticated
  using (public.is_admin(imobiliaria_id)) with check (public.is_admin(imobiliaria_id) and papel = 'corretor');
create policy convites_exclusao on public.convites for delete to authenticated
  using (public.is_admin(imobiliaria_id));

-- Parceiros externos: só administrador
create policy parceiros_tudo on public.parceiros for all to authenticated
  using (public.is_admin(imobiliaria_id)) with check (public.is_admin(imobiliaria_id));

-- Leads, proprietários e captações: o próprio corretor ou o administrador
create policy leads_leitura on public.leads for select to authenticated
  using (public.is_admin(imobiliaria_id) or (corretor_id = auth.uid() and public.is_member(imobiliaria_id)));
create policy leads_insercao on public.leads for insert to authenticated
  with check (public.is_member(imobiliaria_id) and (corretor_id = auth.uid()
    or (public.is_admin(imobiliaria_id) and public.is_membro_ativo(imobiliaria_id, corretor_id))));
create policy leads_edicao on public.leads for update to authenticated
  using (public.is_admin(imobiliaria_id) or (corretor_id = auth.uid() and public.is_member(imobiliaria_id)))
  with check (public.is_admin(imobiliaria_id) or (corretor_id = auth.uid() and public.is_member(imobiliaria_id)));
create policy leads_exclusao on public.leads for delete to authenticated
  using (public.is_admin(imobiliaria_id) or (corretor_id = auth.uid() and public.is_member(imobiliaria_id)));

create policy proprietarios_leitura on public.proprietarios for select to authenticated
  using (public.is_admin(imobiliaria_id) or (corretor_id = auth.uid() and public.is_member(imobiliaria_id)));
create policy proprietarios_insercao on public.proprietarios for insert to authenticated
  with check (public.is_member(imobiliaria_id) and (corretor_id = auth.uid()
    or (public.is_admin(imobiliaria_id) and public.is_membro_ativo(imobiliaria_id, corretor_id))));
create policy proprietarios_edicao on public.proprietarios for update to authenticated
  using (public.is_admin(imobiliaria_id) or (corretor_id = auth.uid() and public.is_member(imobiliaria_id)))
  with check (public.is_admin(imobiliaria_id) or (corretor_id = auth.uid() and public.is_member(imobiliaria_id)));
create policy proprietarios_exclusao on public.proprietarios for delete to authenticated
  using (public.is_admin(imobiliaria_id));

create policy captacoes_leitura on public.captacoes for select to authenticated
  using (public.is_admin(imobiliaria_id) or (corretor_id = auth.uid() and public.is_member(imobiliaria_id)));
create policy captacoes_insercao on public.captacoes for insert to authenticated
  with check (public.is_member(imobiliaria_id) and status = 'ativa' and (corretor_id = auth.uid()
    or (public.is_admin(imobiliaria_id) and public.is_membro_ativo(imobiliaria_id, corretor_id))));
create policy captacoes_edicao on public.captacoes for update to authenticated
  using (public.is_admin(imobiliaria_id) or (corretor_id = auth.uid() and public.is_member(imobiliaria_id)))
  with check (public.is_admin(imobiliaria_id) or (corretor_id = auth.uid() and public.is_member(imobiliaria_id)));
create policy captacoes_exclusao on public.captacoes for delete to authenticated
  using (public.is_admin(imobiliaria_id));

-- Imóveis: cadastro compartilhado da imobiliária
create policy imoveis_leitura on public.imoveis for select to authenticated
  using (public.is_member(imobiliaria_id));
create policy imoveis_insercao on public.imoveis for insert to authenticated
  with check (public.is_member(imobiliaria_id) and criado_por = auth.uid());
create policy imoveis_edicao on public.imoveis for update to authenticated
  using (public.is_admin(imobiliaria_id) or (criado_por = auth.uid() and public.is_member(imobiliaria_id)))
  with check (public.is_member(imobiliaria_id));
create policy imoveis_exclusao on public.imoveis for delete to authenticated
  using (public.is_admin(imobiliaria_id));

-- Transações: dados de mercado para toda a imobiliária; escrita só do administrador
create policy transacoes_leitura on public.transacoes for select to authenticated
  using (public.is_member(imobiliaria_id));
create policy transacoes_escrita on public.transacoes for all to authenticated
  using (public.is_admin(imobiliaria_id)) with check (public.is_admin(imobiliaria_id));

-- Detalhes (honorários, cliente): administrador ou quem participou
create policy detalhes_leitura on public.transacao_detalhes for select to authenticated
  using (public.is_admin(imobiliaria_id) or (public.is_member(imobiliaria_id) and exists (
    select 1 from public.transacao_participantes p
    where p.transacao_id = transacao_detalhes.transacao_id and p.corretor_id = auth.uid())));
create policy detalhes_escrita on public.transacao_detalhes for all to authenticated
  using (public.is_admin(imobiliaria_id)) with check (public.is_admin(imobiliaria_id));

-- Comissões: administrador ou o próprio corretor (nunca a de um colega)
create policy participantes_leitura on public.transacao_participantes for select to authenticated
  using (public.is_admin(imobiliaria_id) or (corretor_id = auth.uid() and public.is_member(imobiliaria_id)));
create policy participantes_escrita on public.transacao_participantes for all to authenticated
  using (public.is_admin(imobiliaria_id)) with check (public.is_admin(imobiliaria_id));

-- Fechamentos informados: corretor informa; administrador registra ou descarta
create policy fechamentos_leitura on public.fechamentos_informados for select to authenticated
  using (public.is_admin(imobiliaria_id) or (corretor_id = auth.uid() and public.is_member(imobiliaria_id)));
create policy fechamentos_insercao on public.fechamentos_informados for insert to authenticated
  with check (corretor_id = auth.uid() and public.is_member(imobiliaria_id) and status = 'pendente');
create policy fechamentos_edicao on public.fechamentos_informados for update to authenticated
  using (public.is_admin(imobiliaria_id)) with check (public.is_admin(imobiliaria_id));
create policy fechamentos_exclusao on public.fechamentos_informados for delete to authenticated
  using (public.is_admin(imobiliaria_id) or (corretor_id = auth.uid() and status = 'pendente'));

-- Agenda: a própria; o administrador vê e marca para a equipe; Frankkia tem a dela
create policy compromissos_leitura on public.compromissos for select to authenticated
  using (dono_id = auth.uid() or (imobiliaria_id is not null and public.is_admin(imobiliaria_id)));
create policy compromissos_insercao on public.compromissos for insert to authenticated
  with check (
    (imobiliaria_id is null and dono_id = auth.uid() and public.is_frankkia())
    or (imobiliaria_id is not null and public.is_member(imobiliaria_id) and (dono_id = auth.uid()
        or (public.is_admin(imobiliaria_id) and public.is_membro_ativo(imobiliaria_id, dono_id)))));
create policy compromissos_edicao on public.compromissos for update to authenticated
  using (dono_id = auth.uid() or (imobiliaria_id is not null and public.is_admin(imobiliaria_id)))
  with check (
    (imobiliaria_id is null and dono_id = auth.uid() and public.is_frankkia())
    or (imobiliaria_id is not null and public.is_member(imobiliaria_id)));
create policy compromissos_exclusao on public.compromissos for delete to authenticated
  using (dono_id = auth.uid() or (imobiliaria_id is not null and public.is_admin(imobiliaria_id)));

-- Academy: todos da imobiliária assistem; administrador cria e edita
create policy trilhas_leitura on public.trilhas for select to authenticated using (public.is_member(imobiliaria_id));
create policy trilhas_escrita on public.trilhas for all to authenticated
  using (public.is_admin(imobiliaria_id)) with check (public.is_admin(imobiliaria_id));
create policy aulas_leitura on public.aulas for select to authenticated using (public.is_member(imobiliaria_id));
create policy aulas_escrita on public.aulas for all to authenticated
  using (public.is_admin(imobiliaria_id)) with check (public.is_admin(imobiliaria_id));
create policy progresso_leitura on public.progresso_aulas for select to authenticated
  using (usuario_id = auth.uid() or public.is_admin(imobiliaria_id));
create policy progresso_insercao on public.progresso_aulas for insert to authenticated
  with check (usuario_id = auth.uid() and public.is_member(imobiliaria_id));
create policy progresso_exclusao on public.progresso_aulas for delete to authenticated
  using (usuario_id = auth.uid());

-- Marketing: logo — todos baixam; administrador envia
create policy logo_leitura on public.marca_logo for select to authenticated using (public.is_member(imobiliaria_id));
create policy logo_escrita on public.marca_logo for all to authenticated
  using (public.is_admin(imobiliaria_id)) with check (public.is_admin(imobiliaria_id));

-- Chamados: quem abriu e a Frankkia (que responde)
create policy chamados_leitura on public.chamados for select to authenticated
  using (autor_id = auth.uid() or public.is_frankkia());
create policy chamados_insercao on public.chamados for insert to authenticated
  with check (autor_id = auth.uid() and public.pertence(imobiliaria_id) and status = 'aberto' and resposta is null);
create policy chamados_resposta on public.chamados for update to authenticated
  using (public.is_frankkia()) with check (public.is_frankkia());

-- Pedidos de upgrade: administrador cria; pagamento é atualizado só pelo servidor (Stripe)
create policy upgrades_leitura on public.pedidos_upgrade for select to authenticated
  using (public.is_admin(imobiliaria_id) or public.is_frankkia());
create policy upgrades_insercao on public.pedidos_upgrade for insert to authenticated
  with check (public.is_admin(imobiliaria_id) and pagamento = 'aguardando' and not liberado and criado_por = auth.uid());

-- Erros do sistema: só a Frankkia lê e muda o status (gravação via registrar_erro)
create policy erros_leitura on public.erros_sistema for select to authenticated using (public.is_frankkia());
create policy erros_status on public.erros_sistema for update to authenticated
  using (public.is_frankkia()) with check (public.is_frankkia());

-- =====================================================================
-- FUNÇÕES DO APP (operações seguras)
-- =====================================================================

-- Ranking da equipe no mês, sem expor comissões (VGC só para o administrador)
create or replace function public.ranking_mes(p_imob uuid, p_mes date)
returns table (corretor_id uuid, nome text, iniciais text, vgv numeric, alugados int, captados int, atendidos int, vgc numeric)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare
  v_ini   timestamptz := date_trunc('month', p_mes::timestamptz);
  v_fim   timestamptz := date_trunc('month', p_mes::timestamptz) + interval '1 month';
  v_admin boolean := public.is_admin(p_imob);
begin
  if not public.is_member(p_imob) then
    raise exception 'SEM_ACESSO' using errcode = '42501';
  end if;
  return query
  with equipe as (
    select m.usuario_id, p.nome, p.iniciais
    from public.membros m join public.perfis p on p.id = m.usuario_id
    where m.imobiliaria_id = p_imob and m.ativo and m.papel = 'corretor'
  ), somas as (
    select tp.transacao_id, sum(tp.pct) as soma
    from public.transacao_participantes tp where tp.imobiliaria_id = p_imob group by tp.transacao_id
  ), partes as (
    select tp.corretor_id as cid, t.tipo, t.valor, d.honorarios_pct, tp.pct, s.soma
    from public.transacao_participantes tp
    join public.transacoes t on t.id = tp.transacao_id
    join public.transacao_detalhes d on d.transacao_id = t.id
    join somas s on s.transacao_id = t.id
    where tp.imobiliaria_id = p_imob and tp.tipo = 'corretor' and t.data >= v_ini and t.data < v_fim
  )
  select e.usuario_id, e.nome, e.iniciais,
    coalesce((select sum(x.valor * x.pct / nullif(x.soma, 0)) from partes x where x.cid = e.usuario_id and x.tipo = 'venda'), 0)::numeric,
    (select count(*) from partes x where x.cid = e.usuario_id and x.tipo = 'locacao')::int,
    (select count(*) from public.captacoes c
       where c.imobiliaria_id = p_imob and c.corretor_id = e.usuario_id and c.captado_em >= v_ini and c.captado_em < v_fim)::int,
    (select count(*) from public.leads l
       where l.imobiliaria_id = p_imob and l.corretor_id = e.usuario_id and l.criado_em >= v_ini and l.criado_em < v_fim
         and true = any (l.checklist))::int,
    case when v_admin then
      coalesce((select sum(x.valor * x.honorarios_pct / 100 * x.pct / 100) from partes x where x.cid = e.usuario_id), 0)::numeric
    end
  from equipe e;
end $$;

-- Estudo de mercado: fechamentos da imobiliária, sem nomes de clientes ou corretores
create or replace function public.estudo_mercado(p_imob uuid)
returns table (transacao_id uuid, tipo text, valor numeric, data timestamptz, area_m2 numeric, captado_em timestamptz,
               categoria text, bairro text, imovel_nome text, logradouro text, numero text, unidade text)
language sql stable security definer set search_path = public as $$
  select t.id, t.tipo, t.valor, t.data, c.area_m2, c.captado_em, i.categoria, i.bairro, i.nome, i.logradouro, i.numero, c.unidade
  from public.transacoes t
  join public.captacoes c on c.id = t.captacao_id
  join public.imoveis i on i.id = c.imovel_id
  where t.imobiliaria_id = p_imob and public.is_member(p_imob);
$$;

-- Ofertas ativas (preço pedido) para comparar com o preço fechado
create or replace function public.ofertas_mercado(p_imob uuid)
returns table (finalidade text, valor numeric, area_m2 numeric, categoria text, bairro text)
language sql stable security definer set search_path = public as $$
  select c.finalidade, c.valor, c.area_m2, i.categoria, i.bairro
  from public.captacoes c join public.imoveis i on i.id = c.imovel_id
  where c.imobiliaria_id = p_imob and c.status = 'ativa' and public.is_member(p_imob);
$$;

-- Registrar venda/locação de forma atômica (só administrador)
create or replace function public.registrar_transacao(
  p_captacao uuid, p_valor numeric, p_honorarios numeric, p_data timestamptz,
  p_cliente text, p_participantes jsonb, p_fechamento uuid default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  c      public.captacoes%rowtype;
  v_id   uuid;
  p      jsonb;
  v_soma numeric := 0;
begin
  select * into c from public.captacoes where id = p_captacao for update;
  if not found then raise exception 'CAPTACAO_NAO_ENCONTRADA' using errcode = 'P0002'; end if;
  if not public.is_admin(c.imobiliaria_id) then raise exception 'APENAS_ADMIN' using errcode = '42501'; end if;
  if c.status <> 'ativa' then raise exception 'CAPTACAO_JA_FECHADA' using errcode = 'P0001'; end if;
  if jsonb_typeof(p_participantes) <> 'array' or jsonb_array_length(p_participantes) = 0 then
    raise exception 'SEM_PARTICIPANTES' using errcode = 'P0001';
  end if;

  insert into public.transacoes (imobiliaria_id, tipo, captacao_id, valor, data, registrado_por)
  values (c.imobiliaria_id, c.finalidade, c.id, p_valor, coalesce(p_data, now()), auth.uid())
  returning id into v_id;

  insert into public.transacao_detalhes (transacao_id, imobiliaria_id, honorarios_pct, cliente)
  values (v_id, c.imobiliaria_id, p_honorarios, nullif(trim(p_cliente), ''));

  for p in select * from jsonb_array_elements(p_participantes) loop
    if p ->> 'tipo' = 'corretor' then
      if not public.is_membro_ativo(c.imobiliaria_id, (p ->> 'ref_id')::uuid) then
        raise exception 'CORRETOR_INVALIDO' using errcode = 'P0001';
      end if;
      insert into public.transacao_participantes (imobiliaria_id, transacao_id, tipo, corretor_id, pct)
      values (c.imobiliaria_id, v_id, 'corretor', (p ->> 'ref_id')::uuid, (p ->> 'pct')::numeric);
    elsif p ->> 'tipo' = 'parceiro' then
      insert into public.transacao_participantes (imobiliaria_id, transacao_id, tipo, parceiro_id, pct)
      values (c.imobiliaria_id, v_id, 'parceiro', (p ->> 'ref_id')::uuid, (p ->> 'pct')::numeric);
    else
      raise exception 'PARTICIPANTE_INVALIDO' using errcode = 'P0001';
    end if;
    v_soma := v_soma + (p ->> 'pct')::numeric;
  end loop;
  if v_soma > 100 then raise exception 'SOMA_ACIMA_DE_100' using errcode = 'P0001'; end if;

  update public.captacoes set status = case when c.finalidade = 'venda' then 'vendida' else 'alugada' end where id = c.id;
  if p_fechamento is not null then
    update public.fechamentos_informados set status = 'registrado'
    where id = p_fechamento and imobiliaria_id = c.imobiliaria_id;
  end if;
  return v_id;
end $$;

-- Convite: dados públicos mínimos para a tela de primeiro acesso (sem login)
create or replace function public.ver_convite(p_token text)
returns table (email text, imobiliaria text, papel text)
language sql stable security definer set search_path = public as $$
  select c.email, i.nome, c.papel
  from public.convites c join public.imobiliarias i on i.id = c.imobiliaria_id
  where c.token = p_token and c.status = 'pendente';
$$;

-- Aceitar convite (depois de criar a conta com o mesmo e-mail do convite)
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

  -- 1º marca o convite como aceito (libera a vaga reservada), 2º cria o membro
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
    update public.imobiliarias set status = 'ativa' where id = c.imobiliaria_id and status = 'aguardando';
    perform set_config('frankkia.operacao_sistema', 'off', true);
  end if;
  return c.imobiliaria_id;
end $$;

-- Frankkia cria uma imobiliária e o convite do administrador (devolve o token do convite)
create or replace function public.criar_imobiliaria(p_nome text, p_cidade text, p_cnpj text, p_plano text, p_admin_email text)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_imob   uuid;
  v_token  text;
  v_limite int;
begin
  if not public.is_frankkia() then raise exception 'APENAS_FRANKKIA' using errcode = '42501'; end if;
  select limite into v_limite from public.planos where nome = p_plano;
  if not found then raise exception 'PLANO_INVALIDO' using errcode = 'P0001'; end if;
  insert into public.imobiliarias (nome, cidade, cnpj, plano, limite_corretores, status)
  values (trim(p_nome), nullif(trim(p_cidade), ''), nullif(trim(p_cnpj), ''), p_plano, v_limite, 'aguardando')
  returning id into v_imob;
  insert into public.convites (imobiliaria_id, email, papel, criado_por)
  values (v_imob, lower(trim(p_admin_email)), 'admin', auth.uid())
  returning token into v_token;
  return v_token;
end $$;

-- Frankkia libera o novo plano de um pedido pago
create or replace function public.liberar_upgrade(p_pedido uuid)
returns void language plpgsql security definer set search_path = public as $$
declare pu public.pedidos_upgrade%rowtype;
begin
  if not public.is_frankkia() then raise exception 'APENAS_FRANKKIA' using errcode = '42501'; end if;
  select * into pu from public.pedidos_upgrade where id = p_pedido for update;
  if not found then raise exception 'PEDIDO_NAO_ENCONTRADO' using errcode = 'P0002'; end if;
  if pu.pagamento <> 'confirmado' or pu.liberado then raise exception 'PEDIDO_NAO_LIBERAVEL' using errcode = 'P0001'; end if;
  update public.imobiliarias
     set plano = pu.plano_novo,
         limite_corretores = (select limite from public.planos where nome = pu.plano_novo)
   where id = pu.imobiliaria_id;
  update public.pedidos_upgrade set liberado = true, liberado_em = now() where id = p_pedido;
end $$;

-- Registra um erro do navegador (agrupado por mensagem e tela)
create or replace function public.registrar_erro(p_mensagem text, p_local text)
returns void language plpgsql security definer set search_path = public as $$
declare v_imob uuid;
begin
  if auth.uid() is null then return; end if;
  select imobiliaria_id into v_imob from public.membros where usuario_id = auth.uid() and ativo limit 1;
  insert into public.erros_sistema (mensagem, local, imobiliarias_afetadas)
  values (left(coalesce(p_mensagem, 'Erro desconhecido'), 500), left(coalesce(p_local, '?'), 120),
          case when v_imob is null then '{}'::uuid[] else array[v_imob] end)
  on conflict (mensagem, local) do update set
    ocorrencias = public.erros_sistema.ocorrencias + 1,
    ultima_vez  = now(),
    status      = case when public.erros_sistema.status = 'corrigido' then 'novo' else public.erros_sistema.status end,
    imobiliarias_afetadas = case
      when v_imob is null or v_imob = any (public.erros_sistema.imobiliarias_afetadas) then public.erros_sistema.imobiliarias_afetadas
      else public.erros_sistema.imobiliarias_afetadas || v_imob end;
end $$;

-- Quem pode chamar o quê (anônimos: só ver um convite)
revoke execute on all functions in schema public from public, anon;
grant  execute on all functions in schema public to authenticated, service_role;
grant  execute on function public.ver_convite(text) to anon;

-- =====================================================================
-- DADOS INICIAIS
-- =====================================================================
insert into public.imobiliarias (nome, cidade, plano, limite_corretores, meta_mensal_vgv, status)
values ('Imobiliária Exemplo', 'São Paulo, SP', 'Equipe 15', 15, 8000000, 'ativa');
