-- =====================================================================
-- FRANKKIA — Portal: vitrine da home (quem anuncia na Frankkia) e imóveis relacionados no anúncio
-- =====================================================================

-- Imobiliárias (e corretores do plano Solo) com anúncio publicado, para a seção da home
create or replace function public.portal_vitrine()
returns jsonb language sql stable security definer set search_path = public as $$
  with contas as (
    select im.id, im.nome, im.slug, im.cidade, im.plano = 'Solo' solo, count(*) total,
           (array_agg(c.corretor_id order by a.publicado_em desc))[1] corretor
      from public.anuncios a
      join public.captacoes c on c.id = a.captacao_id
      join public.imobiliarias im on im.id = a.imobiliaria_id
     where a.publicado and c.status = 'ativa' and public.imob_liberada(im.status, im.teste_ate)
     group by im.id
     order by count(*) desc
     limit 24
  )
  select coalesce(jsonb_agg(x.j order by x.total desc, x.nome), '[]'::jsonb) from (
    select k.total, k.nome,
      case when k.solo
        then jsonb_build_object('tipo', 'corretor', 'nome', pf.nome, 'slug', pf.slug, 'imagem', pf.foto_url, 'cidade', k.cidade, 'total', k.total)
        else jsonb_build_object('tipo', 'imobiliaria', 'nome', k.nome, 'slug', k.slug, 'imagem', public.portal_logo(k.id), 'cidade', k.cidade, 'total', k.total)
      end j
    from contas k left join public.perfis pf on pf.id = k.corretor
  ) x where x.j ->> 'slug' is not null;
$$;

-- Outros imóveis da mesma imobiliária: primeiro os de mesma finalidade e bairro
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
        'quartos', a.quartos, 'banheiros', a.banheiros, 'vagas', a.vagas,
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

revoke execute on function public.portal_vitrine() from public;
revoke execute on function public.portal_relacionados(text) from public;
grant execute on function public.portal_vitrine() to anon, authenticated;
grant execute on function public.portal_relacionados(text) to anon, authenticated;
