-- =====================================================================
-- FRANKKIA — Estudo de mercado, Fase C
-- 1) Lembretes e comentários do estudo (o lembrete com data também vira compromisso na Agenda).
-- 2) Histórico do valor anunciado pelo cliente (gravado sozinho a cada mudança).
-- 3) Ajuste por características: o estudo pode considerar conservação, idade, portaria etc. no valor.
-- =====================================================================
create table if not exists public.avaliacao_notas (
  id             uuid primary key default gen_random_uuid(),
  avaliacao_id   uuid not null references public.avaliacoes(id) on delete cascade,
  autor_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  texto          text not null check (length(trim(texto)) between 1 and 1000),
  lembrete_em    timestamptz,
  compromisso_id uuid,
  criado_em      timestamptz not null default now()
);
create index if not exists avaliacao_notas_idx on public.avaliacao_notas (avaliacao_id, criado_em desc);
alter table public.avaliacao_notas enable row level security;
create policy notas_leitura on public.avaliacao_notas for select to authenticated using (public.pode_mexer_avaliacao(avaliacao_id));
create policy notas_insercao on public.avaliacao_notas for insert to authenticated
  with check (autor_id = auth.uid() and public.pode_mexer_avaliacao(avaliacao_id));
create policy notas_exclusao on public.avaliacao_notas for delete to authenticated using (public.pode_mexer_avaliacao(avaliacao_id));

create table if not exists public.avaliacao_precos (
  id           uuid primary key default gen_random_uuid(),
  avaliacao_id uuid not null references public.avaliacoes(id) on delete cascade,
  valor        numeric(14,2) not null check (valor > 0),
  criado_em    timestamptz not null default now()
);
create index if not exists avaliacao_precos_idx on public.avaliacao_precos (avaliacao_id, criado_em);
alter table public.avaliacao_precos enable row level security;
create policy precos_leitura on public.avaliacao_precos for select to authenticated using (public.pode_mexer_avaliacao(avaliacao_id));

create or replace function public.historico_preco_estudo()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.valor_anunciado is not null and (tg_op = 'INSERT' or new.valor_anunciado is distinct from old.valor_anunciado) then
    insert into public.avaliacao_precos (avaliacao_id, valor) values (new.id, new.valor_anunciado);
  end if;
  return new;
end $$;
drop trigger if exists avaliacoes_historico_preco on public.avaliacoes;
create trigger avaliacoes_historico_preco after insert or update of valor_anunciado on public.avaliacoes
  for each row execute function public.historico_preco_estudo();
insert into public.avaliacao_precos (avaliacao_id, valor, criado_em)
select a.id, a.valor_anunciado, a.criado_em from public.avaliacoes a
 where a.valor_anunciado is not null and not exists (select 1 from public.avaliacao_precos p where p.avaliacao_id = a.id);

alter table public.avaliacoes add column if not exists usar_variaveis boolean not null default true;

-- Apresentação: mais campos para o mesmo cálculo do app (ajuste por características)
create or replace function public.estudo_publico(p_token text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'titulo', a.titulo, 'finalidade', a.finalidade, 'categoria', a.categoria,
    'bairro', a.bairro, 'cidade', a.cidade, 'uf', a.uf, 'logradouro', a.logradouro,
    'area', a.area_m2, 'area_terreno', a.area_terreno, 'quartos', a.quartos, 'suites', a.suites,
    'banheiros', a.banheiros, 'vagas', a.vagas, 'ano', a.ano_construcao, 'conservacao', a.conservacao, 'portaria', a.portaria, 'infraestrutura', a.infraestrutura,
    'orientacao_solar', a.orientacao_solar, 'mobilia', a.mobilia, 'em_condominio', a.em_condominio, 'usar_variaveis', a.usar_variaveis,
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
