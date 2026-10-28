-- =====================================================================
-- FRANKKIA — Avaliações (Estudo de mercado → Avaliações), no estilo do BrokerApp
-- O corretor descreve o imóvel avaliado e junta amostras parecidas: coladas por link (VivaReal, Zap, OLX,
-- lidas pela função ler-anuncio) ou digitadas. O valor sugerido sai do preço médio do m² das amostras.
-- Cada corretor vê só as próprias avaliações; o administrador vê todas.
-- =====================================================================
create table if not exists public.avaliacoes (
  id             uuid primary key default gen_random_uuid(),
  imobiliaria_id uuid not null references public.imobiliarias(id) on delete cascade,
  corretor_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  titulo         text not null check (length(trim(titulo)) between 2 and 160),
  finalidade     text not null check (finalidade in ('venda', 'locacao')),
  categoria      text not null check (length(categoria) <= 60),
  bairro         text check (bairro is null or length(bairro) <= 120),
  cidade         text check (cidade is null or length(cidade) <= 120),
  area_m2        numeric(10,2) not null check (area_m2 > 0),
  quartos        int check (quartos is null or quartos between 0 and 50),
  vagas          int check (vagas is null or vagas between 0 and 50),
  ajuste_rapida  numeric(5,2) not null default 8 check (ajuste_rapida between 0 and 50),
  ajuste_anuncio numeric(5,2) not null default 5 check (ajuste_anuncio between 0 and 50),
  criado_em      timestamptz not null default now()
);
create index if not exists avaliacoes_imob_idx on public.avaliacoes (imobiliaria_id, criado_em desc);

create table if not exists public.avaliacao_amostras (
  id           uuid primary key default gen_random_uuid(),
  avaliacao_id uuid not null references public.avaliacoes(id) on delete cascade,
  origem       text not null default 'manual' check (origem in ('link', 'manual')),
  portal       text check (portal is null or length(portal) <= 60),
  url          text check (url is null or length(url) <= 1000),
  titulo       text check (titulo is null or length(titulo) <= 200),
  valor        numeric(14,2) not null check (valor > 0),
  area_m2      numeric(10,2) not null check (area_m2 > 0),
  quartos      int check (quartos is null or quartos between 0 and 50),
  banheiros    int check (banheiros is null or banheiros between 0 and 50),
  vagas        int check (vagas is null or vagas between 0 and 50),
  bairro       text check (bairro is null or length(bairro) <= 120),
  foto_url     text check (foto_url is null or length(foto_url) <= 1000),
  usar         boolean not null default true,
  criado_em    timestamptz not null default now()
);
create index if not exists avaliacao_amostras_idx on public.avaliacao_amostras (avaliacao_id);

alter table public.avaliacoes enable row level security;
alter table public.avaliacao_amostras enable row level security;

create policy avaliacoes_leitura on public.avaliacoes for select to authenticated
  using (public.is_admin(imobiliaria_id) or (corretor_id = auth.uid() and public.is_member(imobiliaria_id)));
create policy avaliacoes_insercao on public.avaliacoes for insert to authenticated
  with check (corretor_id = auth.uid() and public.is_member(imobiliaria_id));
create policy avaliacoes_edicao on public.avaliacoes for update to authenticated
  using (public.is_admin(imobiliaria_id) or (corretor_id = auth.uid() and public.is_member(imobiliaria_id)))
  with check (public.is_admin(imobiliaria_id) or (corretor_id = auth.uid() and public.is_member(imobiliaria_id)));
create policy avaliacoes_exclusao on public.avaliacoes for delete to authenticated
  using (public.is_admin(imobiliaria_id) or (corretor_id = auth.uid() and public.is_member(imobiliaria_id)));

-- Amostras seguem a avaliação: quem pode mexer na avaliação pode mexer nas amostras dela
create or replace function public.pode_mexer_avaliacao(p_avaliacao uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.avaliacoes a
                  where a.id = p_avaliacao
                    and (public.is_admin(a.imobiliaria_id) or (a.corretor_id = auth.uid() and public.is_member(a.imobiliaria_id))));
$$;
revoke execute on function public.pode_mexer_avaliacao(uuid) from public, anon;
grant execute on function public.pode_mexer_avaliacao(uuid) to authenticated;

create policy amostras_leitura on public.avaliacao_amostras for select to authenticated using (public.pode_mexer_avaliacao(avaliacao_id));
create policy amostras_insercao on public.avaliacao_amostras for insert to authenticated with check (public.pode_mexer_avaliacao(avaliacao_id));
create policy amostras_edicao on public.avaliacao_amostras for update to authenticated
  using (public.pode_mexer_avaliacao(avaliacao_id)) with check (public.pode_mexer_avaliacao(avaliacao_id));
create policy amostras_exclusao on public.avaliacao_amostras for delete to authenticated using (public.pode_mexer_avaliacao(avaliacao_id));
