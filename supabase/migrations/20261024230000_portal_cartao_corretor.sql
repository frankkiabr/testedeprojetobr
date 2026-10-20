-- =====================================================================
-- FRANKKIA — Portal: cartões dos imóveis com o corretor (foto, nome e CRECI)
-- =====================================================================

create or replace function public.portal_cartao_corretor(p_corretor uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('nome', pf.nome, 'slug', pf.slug, 'foto', pf.foto_url, 'creci', pf.creci, 'creci_uf', pf.creci_uf)
    from public.perfis pf where pf.id = p_corretor;
$$;
revoke execute on function public.portal_cartao_corretor(uuid) from public, anon, authenticated;

create or replace function public.portal_cartoes(p_imob uuid, p_corretor uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(x.j order by x.publicado_em desc), '[]'::jsonb) from (
    select a.publicado_em, jsonb_build_object(
      'slug', a.slug, 'titulo', a.titulo, 'codigo', c.codigo, 'finalidade', c.finalidade, 'valor', c.valor,
      'area', c.area_m2, 'categoria', i.categoria, 'bairro', i.bairro, 'cidade', i.cidade, 'uf', i.uf,
      'quartos', a.quartos, 'banheiros', a.banheiros, 'vagas', a.vagas, 'publicado_em', a.publicado_em,
      'anunciante', case when im.plano = 'Solo' then pf.nome else im.nome end,
      'corretor', public.portal_cartao_corretor(c.corretor_id),
      'capa', (select f.url from public.anuncio_fotos f where f.captacao_id = a.captacao_id order by f.ordem, f.criado_em limit 1)
    ) j
    from public.anuncios a
    join public.captacoes c on c.id = a.captacao_id
    join public.imoveis i on i.id = c.imovel_id
    join public.imobiliarias im on im.id = a.imobiliaria_id
    join public.perfis pf on pf.id = c.corretor_id
    where a.publicado and c.status = 'ativa' and public.imob_liberada(im.status, im.teste_ate)
      and (p_imob is null or a.imobiliaria_id = p_imob)
      and (p_corretor is null or c.corretor_id = p_corretor)
    limit 2000
  ) x;
$$;
revoke execute on function public.portal_cartoes(uuid, uuid) from public, anon, authenticated;

create or replace function public.portal_relacionados(p_slug text)
returns jsonb language sql stable security definer set search_path = public as $$
  with atual as (
    select a.captacao_id, a.imobiliaria_id, c.finalidade, i.bairro
      from public.anuncios a join public.captacoes c on c.id = a.captacao_id join public.imoveis i on i.id = c.imovel_id
     where a.slug = p_slug and a.publicado
  )
  select coalesce(jsonb_agg(x.j order by x.ordem), '[]'::jsonb) from (
    select row_number() over (order by (c.finalidade = t.finalidade) desc, (i.bairro = t.bairro) desc, a.publicado_em desc) ordem,
      jsonb_build_object(
        'slug', a.slug, 'titulo', a.titulo, 'codigo', c.codigo, 'finalidade', c.finalidade, 'valor', c.valor,
        'area', c.area_m2, 'categoria', i.categoria, 'bairro', i.bairro, 'cidade', i.cidade, 'uf', i.uf,
        'quartos', a.quartos, 'banheiros', a.banheiros, 'vagas', a.vagas, 'publicado_em', a.publicado_em,
        'corretor', public.portal_cartao_corretor(c.corretor_id),
        'capa', (select f.url from public.anuncio_fotos f where f.captacao_id = a.captacao_id order by f.ordem, f.criado_em limit 1)
      ) j
    from atual t
    join public.anuncios a on a.imobiliaria_id = t.imobiliaria_id and a.captacao_id <> t.captacao_id and a.publicado
    join public.captacoes c on c.id = a.captacao_id and c.status = 'ativa'
    join public.imoveis i on i.id = c.imovel_id
    order by 1
    limit 6
  ) x;
$$;
