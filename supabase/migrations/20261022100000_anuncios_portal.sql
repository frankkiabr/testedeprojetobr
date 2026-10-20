-- =====================================================================
-- FRANKKIA — Portal, fase 1: anúncios das captações (fotos no Cloudflare R2)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Anúncio (1 por captação) e fotos
-- ---------------------------------------------------------------------
create table public.anuncios (
  captacao_id     uuid primary key references public.captacoes(id) on delete cascade,
  imobiliaria_id  uuid not null references public.imobiliarias(id) on delete cascade,
  titulo          text not null default '' check (length(titulo) <= 120),
  descricao       text not null default '' check (length(descricao) <= 5000),
  quartos         smallint check (quartos between 0 and 50),
  suites          smallint check (suites between 0 and 50),
  banheiros       smallint check (banheiros between 0 and 50),
  vagas           smallint check (vagas between 0 and 50),
  condominio      numeric(12,2) check (condominio >= 0),
  iptu            numeric(12,2) check (iptu >= 0),
  caracteristicas text[] not null default '{}',
  publicado       boolean not null default false,
  publicado_em    timestamptz,
  slug            text unique,
  atualizado_em   timestamptz not null default now()
);
create index anuncios_publicados_idx on public.anuncios (imobiliaria_id) where publicado;

create table public.anuncio_fotos (
  id             uuid primary key default gen_random_uuid(),
  captacao_id    uuid not null references public.anuncios(captacao_id) on delete cascade,
  imobiliaria_id uuid not null references public.imobiliarias(id) on delete cascade,
  chave          text not null unique,          -- caminho do arquivo no R2
  url            text not null check (url ~ '^https://'),
  ordem          int not null default 0,        -- 0 = foto de capa
  largura        int,
  altura         int,
  tamanho_bytes  int,
  criado_em      timestamptz not null default now()
);
create index anuncio_fotos_captacao_idx on public.anuncio_fotos (captacao_id, ordem);

-- Quem cuida da captação: o administrador da imobiliária ou o corretor captador
create or replace function public.pode_editar_captacao(p_captacao uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.captacoes c
    where c.id = p_captacao
      and (public.is_admin(c.imobiliaria_id) or (c.corretor_id = auth.uid() and public.is_member(c.imobiliaria_id))));
$$;

alter table public.anuncios enable row level security;
alter table public.anuncio_fotos enable row level security;

create policy anuncios_leitura on public.anuncios for select to authenticated using (public.pode_editar_captacao(captacao_id));
create policy anuncios_insercao on public.anuncios for insert to authenticated
  with check (public.pode_editar_captacao(captacao_id) and not publicado and slug is null
              and imobiliaria_id = (select imobiliaria_id from public.captacoes where id = captacao_id));
create policy anuncios_edicao on public.anuncios for update to authenticated
  using (public.pode_editar_captacao(captacao_id)) with check (public.pode_editar_captacao(captacao_id));
-- Publicar/despublicar e o endereço (slug) só pela função publicar_anuncio
revoke update on public.anuncios from authenticated;
grant update (titulo, descricao, quartos, suites, banheiros, vagas, condominio, iptu, caracteristicas, atualizado_em)
  on public.anuncios to authenticated;

create policy fotos_leitura on public.anuncio_fotos for select to authenticated using (public.pode_editar_captacao(captacao_id));
create policy fotos_insercao on public.anuncio_fotos for insert to authenticated
  with check (public.pode_editar_captacao(captacao_id)
              and imobiliaria_id = (select imobiliaria_id from public.captacoes where id = captacao_id));
create policy fotos_edicao on public.anuncio_fotos for update to authenticated
  using (public.pode_editar_captacao(captacao_id)) with check (public.pode_editar_captacao(captacao_id));
create policy fotos_exclusao on public.anuncio_fotos for delete to authenticated using (public.pode_editar_captacao(captacao_id));

-- No máximo 20 fotos por anúncio
create or replace function public.limitar_fotos()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.anuncio_fotos where captacao_id = new.captacao_id) >= 20 then
    raise exception 'LIMITE_FOTOS: no máximo 20 fotos por anúncio' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger anuncio_fotos_limite before insert on public.anuncio_fotos
  for each row execute function public.limitar_fotos();

-- ---------------------------------------------------------------------
-- 2. Publicar no portal: confere tudo e cria o endereço da página
-- ---------------------------------------------------------------------
create or replace function public.slugificar(p text)
returns text language sql immutable as $$
  select trim(both '-' from regexp_replace(
    lower(translate(coalesce(p, ''),
      'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
      'aaaaaeeeeiiiiooooouuuucnaaaaaeeeeiiiiooooouuuucn')),
    '[^a-z0-9]+', '-', 'g'));
$$;

create or replace function public.publicar_anuncio(p_captacao uuid, p_publicar boolean)
returns text language plpgsql security definer set search_path = public as $$
declare
  c        public.captacoes%rowtype;
  a        public.anuncios%rowtype;
  i        public.imoveis%rowtype;
  pf       public.perfis%rowtype;
  v_limite int;
  v_usados int;
  v_slug   text;
begin
  if not public.pode_editar_captacao(p_captacao) then raise exception 'SEM_PERMISSAO' using errcode = '42501'; end if;
  select * into a from public.anuncios where captacao_id = p_captacao for update;
  if not found then raise exception 'ANUNCIO_INCOMPLETO: preencha o anúncio antes de publicar' using errcode = 'P0001'; end if;

  if not p_publicar then
    update public.anuncios set publicado = false where captacao_id = p_captacao;
    return a.slug;
  end if;

  select * into c from public.captacoes where id = p_captacao;
  select * into i from public.imoveis where id = c.imovel_id;
  select * into pf from public.perfis where id = c.corretor_id;

  if c.status <> 'ativa' then raise exception 'CAPTACAO_FECHADA: só imóveis disponíveis podem ser anunciados' using errcode = 'P0001'; end if;
  if length(trim(a.titulo)) < 10 then raise exception 'TITULO_CURTO: escreva um título com pelo menos 10 letras' using errcode = 'P0001'; end if;
  if not exists (select 1 from public.anuncio_fotos where captacao_id = p_captacao) then
    raise exception 'SEM_FOTOS: adicione pelo menos uma foto' using errcode = 'P0001';
  end if;
  -- O anúncio mostra o CRECI de quem anuncia (exigência do conselho); estagiário não publica sozinho
  if pf.estagiario or coalesce(trim(pf.creci), '') = '' then
    raise exception 'SEM_CRECI: o corretor responsável precisa ter CRECI cadastrado (estagiário não publica sozinho)' using errcode = 'P0001';
  end if;

  -- Limite de anúncios do plano (compartilhado pela equipe)
  select p.anuncios into v_limite from public.imobiliarias im join public.planos p on p.nome = im.plano where im.id = c.imobiliaria_id;
  select count(*) into v_usados from public.anuncios where imobiliaria_id = c.imobiliaria_id and publicado and captacao_id <> p_captacao;
  if not a.publicado and v_usados >= coalesce(v_limite, 0) then
    raise exception 'LIMITE_ANUNCIOS: o plano permite % anúncios publicados', coalesce(v_limite, 0) using errcode = 'P0001';
  end if;

  v_slug := coalesce(a.slug, public.slugificar(concat_ws(' ',
    i.categoria,
    case when a.quartos > 0 then a.quartos || ' quartos' end,
    case when c.finalidade = 'venda' then 'a venda' else 'para alugar' end,
    i.bairro, i.cidade, i.uf)) || '-' || left(replace(c.id::text, '-', ''), 6));

  update public.anuncios
     set publicado = true, publicado_em = coalesce(publicado_em, now()), slug = v_slug, atualizado_em = now()
   where captacao_id = p_captacao;
  return v_slug;
end $$;

-- Vendido ou alugado: sai do portal sozinho
create or replace function public.despublicar_fechada()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status <> 'ativa' and old.status = 'ativa' then
    update public.anuncios set publicado = false where captacao_id = new.id and publicado;
  end if;
  return new;
end $$;
create trigger captacoes_despublicar after update of status on public.captacoes
  for each row execute function public.despublicar_fechada();

revoke execute on function public.publicar_anuncio(uuid, boolean) from public, anon;
grant execute on function public.publicar_anuncio(uuid, boolean) to authenticated;
revoke execute on function public.limitar_fotos() from public, anon, authenticated;
revoke execute on function public.despublicar_fechada() from public, anon, authenticated;
