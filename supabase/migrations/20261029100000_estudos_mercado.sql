-- =====================================================================
-- FRANKKIA — Estudo de mercado completo (Fase A), no estilo do BrokerApp, com o jeito Frankkia:
-- todos os dados do imóvel avaliado entram de uma vez no "Novo estudo" (sem preencher de novo depois).
-- Valores: Improvável (média do m² das amostras × área), Valor de mercado (-10%) e Urgência na venda (-20%),
-- com ajuste e "mostrar na apresentação" em cada um. Situação: apresentado, exclusividade, vendido, expirado.
-- As tabelas avaliacoes/avaliacao_amostras (criadas em 20261028170000, ainda sem uso) ganham os campos novos.
-- =====================================================================
alter table public.avaliacoes
  drop column if exists ajuste_rapida,
  drop column if exists ajuste_anuncio,
  add column if not exists cep              text check (cep is null or cep ~ '^\d{8}$'),
  add column if not exists logradouro       text check (logradouro is null or length(logradouro) <= 160),
  add column if not exists numero           text check (numero is null or length(numero) <= 20),
  add column if not exists complemento      text check (complemento is null or length(complemento) <= 80),
  add column if not exists uf               text check (uf is null or uf ~ '^[A-Z]{2}$'),
  add column if not exists lat              double precision,
  add column if not exists lng              double precision,
  add column if not exists data_visita      date,
  add column if not exists area_terreno     numeric(12,2) check (area_terreno is null or area_terreno > 0),
  add column if not exists suites           int check (suites is null or suites between 0 and 50),
  add column if not exists banheiros        int check (banheiros is null or banheiros between 0 and 50),
  add column if not exists ano_construcao   int check (ano_construcao is null or ano_construcao between 1800 and 2100),
  add column if not exists em_condominio    boolean,
  add column if not exists infraestrutura   text check (infraestrutura is null or infraestrutura in ('nao', 'parcial', 'completa')),
  add column if not exists portaria         text check (portaria is null or portaria in ('nao', 'parcial', '24h')),
  add column if not exists orientacao_solar text check (orientacao_solar is null or orientacao_solar in ('nascente', 'poente', 'norte', 'sul', 'mista')),
  add column if not exists conservacao      text check (conservacao is null or conservacao in ('reformar', 'regular', 'bom', 'otimo', 'novo')),
  add column if not exists mobilia          text check (mobilia is null or mobilia in ('nao', 'semi', 'mobiliado')),
  add column if not exists valor_anunciado  numeric(14,2) check (valor_anunciado is null or valor_anunciado > 0),
  add column if not exists observacoes      text check (observacoes is null or length(observacoes) <= 2750),
  add column if not exists foto_url         text check (foto_url is null or length(foto_url) <= 1000),
  -- Ligações (sem chave estrangeira: o proprietário novo pode ser gravado logo depois do estudo)
  add column if not exists proprietario_id  uuid,
  add column if not exists captacao_id      uuid,
  -- Valores encontrados (ajustes em % de desconto sobre o Improvável)
  add column if not exists ajuste_improvavel numeric(5,2) not null default 0  check (ajuste_improvavel between 0 and 50),
  add column if not exists ajuste_mercado    numeric(5,2) not null default 10 check (ajuste_mercado between 0 and 50),
  add column if not exists ajuste_urgencia   numeric(5,2) not null default 20 check (ajuste_urgencia between 0 and 60),
  add column if not exists mostrar_improvavel boolean not null default true,
  add column if not exists mostrar_mercado    boolean not null default true,
  add column if not exists mostrar_urgencia   boolean not null default true,
  -- Acompanhamento do estudo
  add column if not exists apresentado      boolean not null default false,
  add column if not exists exclusividade    boolean not null default false,
  add column if not exists vendido          boolean not null default false,
  add column if not exists expirado         boolean not null default false,
  add column if not exists link_liberado    boolean not null default true,
  add column if not exists atualizado_em    timestamptz not null default now();

alter table public.avaliacao_amostras drop constraint if exists avaliacao_amostras_origem_check;
alter table public.avaliacao_amostras add constraint avaliacao_amostras_origem_check check (origem in ('link', 'manual', 'radar'));
alter table public.avaliacao_amostras
  add column if not exists endereco       text check (endereco is null or length(endereco) <= 200),
  add column if not exists suites         int check (suites is null or suites between 0 and 50),
  add column if not exists portaria       text check (portaria is null or portaria in ('nao', 'parcial', '24h')),
  add column if not exists infraestrutura text check (infraestrutura is null or infraestrutura in ('nao', 'parcial', 'completa')),
  add column if not exists ano_construcao int check (ano_construcao is null or ano_construcao between 1800 and 2100);

-- Alterar o corretor do estudo: só o administrador, e só para alguém da mesma imobiliária
create or replace function public.proteger_dono_estudo()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.corretor_id is distinct from old.corretor_id then
    if not public.is_admin(new.imobiliaria_id) or not public.is_membro_ativo(new.imobiliaria_id, new.corretor_id) then
      raise exception 'APENAS_ADMIN' using errcode = '42501';
    end if;
  end if;
  if new.imobiliaria_id is distinct from old.imobiliaria_id then
    raise exception 'DADOS_INVALIDOS' using errcode = 'P0001';
  end if;
  new.atualizado_em := now();
  return new;
end $$;
drop trigger if exists avaliacoes_protecao on public.avaliacoes;
create trigger avaliacoes_protecao before update on public.avaliacoes
  for each row execute function public.proteger_dono_estudo();
