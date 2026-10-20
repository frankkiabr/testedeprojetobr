-- =====================================================================
-- FRANKKIA — Portal, fase 2: páginas públicas (anúncio, corretor, imobiliária) e contato → lead
-- Visitante (sem login) só lê o que está publicado, por funções; nada das tabelas fica aberto.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Endereço das páginas do corretor e da imobiliária
--    Criado na primeira publicação (antes disso não há página pública).
-- ---------------------------------------------------------------------
alter table public.perfis add column if not exists slug text unique;
alter table public.imobiliarias add column if not exists slug text unique;

create or replace function public.garantir_slugs_portal()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_corretor uuid;
begin
  if new.publicado and not coalesce(old.publicado, false) then
    select corretor_id into v_corretor from public.captacoes where id = new.captacao_id;
    update public.perfis
       set slug = coalesce(nullif(public.slugificar(nome), ''), 'corretor') || '-' || left(replace(id::text, '-', ''), 5)
     where id = v_corretor and slug is null;
    update public.imobiliarias
       set slug = coalesce(nullif(public.slugificar(nome), ''), 'imobiliaria') || '-' || left(replace(id::text, '-', ''), 5)
     where id = new.imobiliaria_id and slug is null;
  end if;
  return new;
end $$;
drop trigger if exists anuncios_slugs_portal on public.anuncios;
create trigger anuncios_slugs_portal after update of publicado on public.anuncios
  for each row execute function public.garantir_slugs_portal();
revoke execute on function public.garantir_slugs_portal() from public, anon, authenticated;

-- Quem já tem anúncio publicado ganha o endereço agora
update public.perfis p
   set slug = coalesce(nullif(public.slugificar(p.nome), ''), 'corretor') || '-' || left(replace(p.id::text, '-', ''), 5)
 where p.slug is null
   and exists (select 1 from public.anuncios a join public.captacoes c on c.id = a.captacao_id where a.publicado and c.corretor_id = p.id);
update public.imobiliarias i
   set slug = coalesce(nullif(public.slugificar(i.nome), ''), 'imobiliaria') || '-' || left(replace(i.id::text, '-', ''), 5)
 where i.slug is null
   and exists (select 1 from public.anuncios a where a.publicado and a.imobiliaria_id = i.id);

-- ---------------------------------------------------------------------
-- 2. Leitura pública (só anúncios publicados de imobiliárias liberadas)
-- ---------------------------------------------------------------------
create or replace function public.portal_logo(p_imob uuid)
returns text language sql stable security definer set search_path = public as $$
  select 'https://yvbbktrufoyhtiotholf.supabase.co/storage/v1/object/public/marca/' || arquivo_path
    from public.marca_logo where imobiliaria_id = p_imob;
$$;

-- Cartões (lista) dos anúncios publicados de uma imobiliária ou de um corretor
create or replace function public.portal_cartoes(p_imob uuid, p_corretor uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(x.j order by x.publicado_em desc), '[]'::jsonb) from (
    select a.publicado_em, jsonb_build_object(
      'slug', a.slug, 'titulo', a.titulo, 'codigo', c.codigo, 'finalidade', c.finalidade, 'valor', c.valor,
      'area', c.area_m2, 'categoria', i.categoria, 'bairro', i.bairro, 'cidade', i.cidade, 'uf', i.uf,
      'quartos', a.quartos, 'banheiros', a.banheiros, 'vagas', a.vagas,
      'capa', (select f.url from public.anuncio_fotos f where f.captacao_id = a.captacao_id order by f.ordem, f.criado_em limit 1)
    ) j
    from public.anuncios a
    join public.captacoes c on c.id = a.captacao_id
    join public.imoveis i on i.id = c.imovel_id
    join public.imobiliarias im on im.id = a.imobiliaria_id
    where a.publicado and c.status = 'ativa' and public.imob_liberada(im.status, im.teste_ate)
      and (p_imob is null or a.imobiliaria_id = p_imob)
      and (p_corretor is null or c.corretor_id = p_corretor)
  ) x;
$$;

-- Página do anúncio (pelo endereço da página ou pelo código FK-XXXXXX)
create or replace function public.portal_anuncio(p_slug text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'slug', a.slug, 'titulo', a.titulo, 'descricao', a.descricao,
    'quartos', a.quartos, 'suites', a.suites, 'banheiros', a.banheiros, 'vagas', a.vagas,
    'condominio', a.condominio, 'iptu', a.iptu, 'caracteristicas', a.caracteristicas,
    'publicado_em', a.publicado_em, 'atualizado_em', a.atualizado_em,
    'codigo', c.codigo, 'finalidade', c.finalidade, 'valor', c.valor, 'area', c.area_m2, 'unidade', c.unidade,
    'categoria', i.categoria, 'edificio', i.nome, 'logradouro', i.logradouro, 'numero', i.numero,
    'bairro', i.bairro, 'cidade', i.cidade, 'uf', i.uf, 'cep', i.cep, 'lat', i.lat, 'lng', i.lng,
    'fotos', (select coalesce(jsonb_agg(jsonb_build_object('url', f.url, 'largura', f.largura, 'altura', f.altura) order by f.ordem, f.criado_em), '[]'::jsonb)
                from public.anuncio_fotos f where f.captacao_id = a.captacao_id),
    'corretor', jsonb_build_object('nome', pf.nome, 'slug', pf.slug, 'foto', pf.foto_url, 'creci', pf.creci,
                                   'creci_uf', pf.creci_uf, 'telefone', coalesce(nullif(pf.telefone, ''), im.telefone)),
    'imobiliaria', jsonb_build_object('nome', im.nome, 'slug', im.slug, 'cidade', im.cidade, 'telefone', im.telefone,
                                      'logo', public.portal_logo(im.id), 'solo', im.plano = 'Solo')
  )
  from public.anuncios a
  join public.captacoes c on c.id = a.captacao_id
  join public.imoveis i on i.id = c.imovel_id
  join public.imobiliarias im on im.id = a.imobiliaria_id
  join public.perfis pf on pf.id = c.corretor_id
  where (a.slug = p_slug or c.codigo = upper(p_slug))
    and a.publicado and c.status = 'ativa' and public.imob_liberada(im.status, im.teste_ate)
  limit 1;
$$;

-- Página do corretor (só existe se ele tiver algum anúncio publicado)
create or replace function public.portal_corretor(p_slug text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  pf public.perfis%rowtype;
  v_imob uuid;
  v_cartoes jsonb;
begin
  select * into pf from public.perfis where slug = p_slug;
  if not found then return null; end if;
  v_cartoes := public.portal_cartoes(null, pf.id);
  if jsonb_array_length(v_cartoes) = 0 then return null; end if;
  select a.imobiliaria_id into v_imob from public.anuncios a join public.captacoes c on c.id = a.captacao_id
   where a.publicado and c.corretor_id = pf.id order by a.publicado_em desc limit 1;
  return (select jsonb_build_object(
    'nome', pf.nome, 'slug', pf.slug, 'foto', pf.foto_url, 'creci', pf.creci, 'creci_uf', pf.creci_uf,
    'telefone', coalesce(nullif(pf.telefone, ''), im.telefone),
    'imobiliaria', jsonb_build_object('nome', im.nome, 'slug', im.slug, 'logo', public.portal_logo(im.id), 'solo', im.plano = 'Solo'),
    'anuncios', v_cartoes)
    from public.imobiliarias im where im.id = v_imob);
end $$;

-- Página da imobiliária: anúncios e corretores que anunciam
create or replace function public.portal_imobiliaria(p_slug text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  im public.imobiliarias%rowtype;
  v_cartoes jsonb;
begin
  select * into im from public.imobiliarias where slug = p_slug;
  if not found then return null; end if;
  v_cartoes := public.portal_cartoes(im.id, null);
  if jsonb_array_length(v_cartoes) = 0 then return null; end if;
  return jsonb_build_object(
    'nome', im.nome, 'slug', im.slug, 'cidade', im.cidade, 'telefone', im.telefone,
    'logo', public.portal_logo(im.id), 'solo', im.plano = 'Solo',
    'anuncios', v_cartoes,
    'corretores', (select coalesce(jsonb_agg(distinct jsonb_build_object('nome', pf.nome, 'slug', pf.slug, 'foto', pf.foto_url,
                                                                        'creci', pf.creci, 'creci_uf', pf.creci_uf)), '[]'::jsonb)
                     from public.anuncios a join public.captacoes c on c.id = a.captacao_id join public.perfis pf on pf.id = c.corretor_id
                    where a.imobiliaria_id = im.id and a.publicado and c.status = 'ativa' and pf.slug is not null));
end $$;

-- ---------------------------------------------------------------------
-- 3. Contato pelo formulário do anúncio → lead do corretor responsável
-- ---------------------------------------------------------------------
create or replace function public.portal_contato(p_slug text, p_nome text, p_telefone text, p_email text, p_mensagem text)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  a public.anuncios%rowtype;
  c public.captacoes%rowtype;
  v_tel text := regexp_replace(coalesce(p_telefone, ''), '\D', '', 'g');
  v_nome text := left(trim(coalesce(p_nome, '')), 120);
  v_email text := lower(left(trim(coalesce(p_email, '')), 160));
  v_obs text;
begin
  select an.* into a from public.anuncios an join public.imobiliarias im on im.id = an.imobiliaria_id
   where an.slug = p_slug and an.publicado and public.imob_liberada(im.status, im.teste_ate);
  if not found then raise exception 'ANUNCIO_INDISPONIVEL' using errcode = 'P0001'; end if;
  select * into c from public.captacoes where id = a.captacao_id;
  if c.status <> 'ativa' then raise exception 'ANUNCIO_INDISPONIVEL' using errcode = 'P0001'; end if;

  if length(v_nome) < 2 or length(v_tel) not between 10 and 13 then
    raise exception 'DADOS_INVALIDOS: informe nome e WhatsApp com DDD' using errcode = 'P0001';
  end if;
  if v_email <> '' and v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'DADOS_INVALIDOS: e-mail inválido' using errcode = 'P0001';
  end if;

  -- Mesmo telefone no mesmo imóvel nas últimas 24h: não duplica o lead
  if exists (select 1 from public.leads where imobiliaria_id = c.imobiliaria_id and telefone = v_tel
               and origem = 'Portal' and interesse like c.codigo || '%' and criado_em > now() - interval '24 hours') then
    return true;
  end if;
  -- Proteção contra envio em massa
  if (select count(*) from public.leads where imobiliaria_id = c.imobiliaria_id and origem = 'Portal'
        and criado_em > now() - interval '1 hour') >= 60
     or (select count(*) from public.leads where telefone = v_tel and origem = 'Portal'
        and criado_em > now() - interval '1 hour') >= 5 then
    raise exception 'MUITOS_ENVIOS' using errcode = 'P0001';
  end if;

  v_obs := concat_ws(E'\n',
    nullif(left(trim(coalesce(p_mensagem, '')), 1000), ''),
    case when v_email <> '' then 'E-mail: ' || v_email end,
    'Contato pelo portal (anúncio ' || c.codigo || ').');

  insert into public.leads (imobiliaria_id, corretor_id, nome, telefone, origem, interesse, observacoes)
  values (c.imobiliaria_id, c.corretor_id, v_nome, v_tel, 'Portal', left(c.codigo || ' · ' || a.titulo, 200), v_obs);
  return true;
end $$;

revoke execute on function public.portal_logo(uuid) from public;
revoke execute on function public.portal_cartoes(uuid, uuid) from public;
revoke execute on function public.portal_anuncio(text) from public;
revoke execute on function public.portal_corretor(text) from public;
revoke execute on function public.portal_imobiliaria(text) from public;
revoke execute on function public.portal_contato(text, text, text, text, text) from public;
grant execute on function public.portal_anuncio(text) to anon, authenticated;
grant execute on function public.portal_corretor(text) to anon, authenticated;
grant execute on function public.portal_imobiliaria(text) to anon, authenticated;
grant execute on function public.portal_contato(text, text, text, text, text) to anon, authenticated;
