-- =====================================================================
-- FRANKKIA — Anúncio mostra o anunciante como nos portais: desde quando está na Frankkia e quantos imóveis anuncia
-- (corretor e imobiliária).
-- =====================================================================
create or replace function public.portal_anuncio(p_slug text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'slug', a.slug, 'titulo', a.titulo, 'descricao', a.descricao,
    'quartos', a.quartos, 'suites', a.suites, 'banheiros', a.banheiros, 'vagas', a.vagas,
    'condominio', a.condominio, 'iptu', a.iptu, 'caracteristicas', a.caracteristicas, 'lancamento', a.lancamento,
    'publicado_em', a.publicado_em, 'atualizado_em', a.atualizado_em,
    'codigo', c.codigo, 'finalidade', c.finalidade, 'valor', c.valor, 'area', c.area_m2, 'unidade', c.unidade,
    'categoria', i.categoria, 'edificio', i.nome, 'logradouro', i.logradouro, 'numero', i.numero,
    'bairro', i.bairro, 'cidade', i.cidade, 'uf', i.uf, 'cep', i.cep, 'lat', i.lat, 'lng', i.lng,
    'fotos', (select coalesce(jsonb_agg(jsonb_build_object('url', f.url, 'largura', f.largura, 'altura', f.altura) order by f.ordem, f.criado_em), '[]'::jsonb)
                from public.anuncio_fotos f where f.captacao_id = a.captacao_id),
    'corretor', jsonb_build_object('nome', pf.nome, 'slug', pf.slug, 'foto', pf.foto_url, 'creci', pf.creci,
                                   'creci_uf', pf.creci_uf, 'creci_verificado', pf.creci_status = 'verificado',
                                   'telefone', coalesce(nullif(pf.telefone, ''), im.telefone), 'desde', pf.criado_em,
                                   'imoveis', (select count(*) from public.anuncios a2 join public.captacoes c2 on c2.id = a2.captacao_id
                                                where a2.publicado and c2.status = 'ativa' and c2.corretor_id = c.corretor_id)),
    'imobiliaria', jsonb_build_object('nome', im.nome, 'slug', im.slug, 'cidade', im.cidade, 'telefone', im.telefone,
                                      'logo', public.portal_logo(im.id), 'solo', im.plano = 'Solo', 'creci_j', im.creci_j,
                                      'desde', im.criado_em,
                                      'imoveis', (select count(*) from public.anuncios a3 join public.captacoes c3 on c3.id = a3.captacao_id
                                                   where a3.publicado and c3.status = 'ativa' and a3.imobiliaria_id = im.id))
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
