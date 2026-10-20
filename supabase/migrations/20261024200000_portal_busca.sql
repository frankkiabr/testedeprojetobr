-- =====================================================================
-- FRANKKIA — Portal: busca geral (/imoveis) com todos os imóveis publicados
-- =====================================================================

-- Os cartões passam a trazer quem anuncia (para a busca geral mostrar a imobiliária ou o corretor)
create or replace function public.portal_cartoes(p_imob uuid, p_corretor uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(x.j order by x.publicado_em desc), '[]'::jsonb) from (
    select a.publicado_em, jsonb_build_object(
      'slug', a.slug, 'titulo', a.titulo, 'codigo', c.codigo, 'finalidade', c.finalidade, 'valor', c.valor,
      'area', c.area_m2, 'categoria', i.categoria, 'bairro', i.bairro, 'cidade', i.cidade, 'uf', i.uf,
      'quartos', a.quartos, 'banheiros', a.banheiros, 'vagas', a.vagas, 'publicado_em', a.publicado_em,
      'anunciante', case when im.plano = 'Solo' then pf.nome else im.nome end,
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

-- Busca geral: todos os imóveis publicados no portal
create or replace function public.portal_busca()
returns jsonb language sql stable security definer set search_path = public as $$
  select public.portal_cartoes(null, null);
$$;
revoke execute on function public.portal_busca() from public;
grant execute on function public.portal_busca() to anon, authenticated;
