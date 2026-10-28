-- =====================================================================
-- FRANKKIA — Estudo de mercado, Fase B
-- 1) Apresentação para o proprietário: link público /estudo/<token> (só com o link liberado no estudo).
-- 2) Imóveis vendidos na região: vendas registradas pela imobiliária + vendas cadastradas à mão
--    ("Cadastrar imóvel vendido"). Só dados do imóvel: nunca cliente nem comissão. O nome do corretor
--    aparece só se o administrador ligar "Mostrar o nome do corretor nos imóveis vendidos".
-- =====================================================================

-- ---------- 1. Apresentação ----------
alter table public.avaliacoes add column if not exists token text not null unique
  default replace(gen_random_uuid()::text, '-', '');

create or replace function public.estudo_publico(p_token text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'titulo', a.titulo, 'finalidade', a.finalidade, 'categoria', a.categoria,
    'bairro', a.bairro, 'cidade', a.cidade, 'uf', a.uf, 'logradouro', a.logradouro,
    'area', a.area_m2, 'area_terreno', a.area_terreno, 'quartos', a.quartos, 'suites', a.suites,
    'banheiros', a.banheiros, 'vagas', a.vagas, 'ano', a.ano_construcao, 'conservacao', a.conservacao,
    'ajuste_improvavel', a.ajuste_improvavel, 'ajuste_mercado', a.ajuste_mercado, 'ajuste_urgencia', a.ajuste_urgencia,
    'mostrar_improvavel', a.mostrar_improvavel, 'mostrar_mercado', a.mostrar_mercado, 'mostrar_urgencia', a.mostrar_urgencia,
    'criado_em', a.criado_em, 'atualizado_em', a.atualizado_em,
    'amostras', (select coalesce(jsonb_agg(jsonb_build_object(
                    'valor', s.valor, 'area', s.area_m2, 'quartos', s.quartos, 'suites', s.suites, 'banheiros', s.banheiros,
                    'vagas', s.vagas, 'bairro', s.bairro, 'endereco', coalesce(s.endereco, s.titulo), 'foto', s.foto_url,
                    'origem', s.origem) order by s.criado_em), '[]'::jsonb)
                   from public.avaliacao_amostras s where s.avaliacao_id = a.id and s.usar),
    'corretor', jsonb_build_object('nome', pf.nome, 'foto', pf.foto_url, 'creci', pf.creci, 'creci_uf', pf.creci_uf,
                                   'telefone', coalesce(nullif(pf.telefone, ''), im.telefone), 'slug', pf.slug),
    'imobiliaria', jsonb_build_object('nome', im.nome, 'logo', public.portal_logo(im.id), 'solo', im.plano = 'Solo',
                                      'creci_j', im.creci_j)
  )
  from public.avaliacoes a
  join public.imobiliarias im on im.id = a.imobiliaria_id
  join public.perfis pf on pf.id = a.corretor_id
  where a.token = p_token and a.link_liberado and public.imob_liberada(im.status, im.teste_ate)
  limit 1;
$$;
revoke execute on function public.estudo_publico(text) from public;
grant execute on function public.estudo_publico(text) to anon, authenticated;

-- ---------- 2. Imóveis vendidos na região ----------
alter table public.imobiliarias add column if not exists mostrar_corretor_vendidos boolean not null default false;

alter table public.avaliacao_amostras drop constraint if exists avaliacao_amostras_origem_check;
alter table public.avaliacao_amostras add constraint avaliacao_amostras_origem_check
  check (origem in ('link', 'manual', 'radar', 'vendido'));

-- Venda que não passou pela Frankkia, cadastrada pelo corretor para servir de referência
create table if not exists public.vendas_externas (
  id               uuid primary key default gen_random_uuid(),
  imobiliaria_id   uuid not null references public.imobiliarias(id) on delete cascade,
  corretor_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  finalidade       text not null default 'venda' check (finalidade in ('venda', 'locacao')),
  categoria        text not null check (length(categoria) <= 60),
  logradouro       text check (logradouro is null or length(logradouro) <= 160),
  bairro           text not null check (length(trim(bairro)) between 2 and 120),
  cidade           text not null check (length(trim(cidade)) between 2 and 120),
  uf               text check (uf is null or uf ~ '^[A-Z]{2}$'),
  area_m2          numeric(10,2) not null check (area_m2 > 0),
  quartos          int check (quartos is null or quartos between 0 and 50),
  vagas            int check (vagas is null or vagas between 0 and 50),
  valor_anunciado  numeric(14,2) check (valor_anunciado is null or valor_anunciado > 0),
  valor_venda      numeric(14,2) not null check (valor_venda > 0),
  data_venda       date not null,
  dias_para_vender int check (dias_para_vender is null or dias_para_vender between 0 and 3650),
  criado_em        timestamptz not null default now()
);
create index if not exists vendas_externas_imob_idx on public.vendas_externas (imobiliaria_id, data_venda desc);
alter table public.vendas_externas enable row level security;
create policy vendas_externas_leitura on public.vendas_externas for select to authenticated
  using (public.is_admin(imobiliaria_id) or (corretor_id = auth.uid() and public.is_member(imobiliaria_id)));
create policy vendas_externas_insercao on public.vendas_externas for insert to authenticated
  with check (corretor_id = auth.uid() and public.is_member(imobiliaria_id));
create policy vendas_externas_exclusao on public.vendas_externas for delete to authenticated
  using (public.is_admin(imobiliaria_id) or (corretor_id = auth.uid() and public.is_member(imobiliaria_id)));

/**
 * Vendidos (ou alugados) da imobiliária de quem pede: só dados do imóvel. Corretor vê as vendas da equipe
 * sem cliente e sem comissão; o nome do corretor só com a chave do administrador (ou se for o próprio).
 */
create or replace function public.vendidos_regiao(
  p_finalidade text default 'venda', p_cidade text default null, p_bairro text default null,
  p_categoria text default null, p_meses int default null)
returns table (
  id text, origem text, categoria text, logradouro text, bairro text, cidade text, uf text,
  area numeric, quartos int, vagas int, valor_anunciado numeric, valor_venda numeric, data_venda date,
  dias int, foto text, imobiliaria text, corretor text)
language sql stable security definer set search_path = public as $$
  with eu as (
    select m.imobiliaria_id as imob, i.mostrar_corretor_vendidos as mostrar, i.nome as imob_nome
      from public.membros m join public.imobiliarias i on i.id = m.imobiliaria_id
     where m.usuario_id = auth.uid() and m.ativo and public.imob_liberada(i.status, i.teste_ate)
     order by m.criado_em limit 1
  ),
  todos as (
    select t.id::text, 'frankkia'::text as origem, im.categoria, im.logradouro, im.bairro, im.cidade, im.uf,
           c.area_m2 as area, an.quartos, an.vagas, c.valor as valor_anunciado, t.valor as valor_venda, t.data::date as data_venda,
           greatest(0, (t.data::date - c.captado_em::date))::int as dias,
           (select f.url from public.anuncio_fotos f where f.captacao_id = c.id order by f.ordem, f.criado_em limit 1) as foto,
           eu.imob_nome as imobiliaria,
           case when eu.mostrar or c.corretor_id = auth.uid() then pf.nome end as corretor
      from eu
      join public.transacoes t on t.imobiliaria_id = eu.imob
      join public.captacoes c on c.id = t.captacao_id
      join public.imoveis im on im.id = c.imovel_id
      left join public.anuncios an on an.captacao_id = c.id
      left join public.perfis pf on pf.id = c.corretor_id
     where t.tipo = p_finalidade
    union all
    select v.id::text, 'cadastrada', v.categoria, v.logradouro, v.bairro, v.cidade, v.uf,
           v.area_m2, v.quartos, v.vagas, v.valor_anunciado, v.valor_venda, v.data_venda, v.dias_para_vender,
           null, eu.imob_nome,
           case when eu.mostrar or v.corretor_id = auth.uid() then pf.nome end
      from eu
      join public.vendas_externas v on v.imobiliaria_id = eu.imob
      left join public.perfis pf on pf.id = v.corretor_id
     where v.finalidade = p_finalidade
  )
  select * from todos
   where (p_cidade is null or lower(cidade) = lower(trim(p_cidade)))
     and (p_bairro is null or lower(bairro) = lower(trim(p_bairro)))
     and (p_categoria is null or categoria = p_categoria)
     and (p_meses is null or data_venda >= (current_date - make_interval(months => p_meses))::date)
   order by data_venda desc
   limit 60;
$$;
revoke execute on function public.vendidos_regiao(text, text, text, text, int) from public, anon;
grant execute on function public.vendidos_regiao(text, text, text, text, int) to authenticated;
