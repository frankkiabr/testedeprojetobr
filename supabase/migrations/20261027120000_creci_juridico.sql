-- =====================================================================
-- FRANKKIA — CRECI da imobiliária (CRECI-J). O Decreto 81.871/1978 (art. 4º) pede a inscrição da
-- pessoa jurídica nos anúncios. Corretor Solo não tem CRECI-J: aparece só o CRECI dele.
-- =====================================================================
alter table public.imobiliarias add column if not exists creci_j text
  check (creci_j is null or length(trim(creci_j)) between 2 and 30);

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
                                      'logo', public.portal_logo(im.id), 'solo', im.plano = 'Solo', 'creci_j', im.creci_j)
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
    'logo', public.portal_logo(im.id), 'solo', im.plano = 'Solo', 'creci_j', im.creci_j,
    'anuncios', v_cartoes,
    'corretores', (select coalesce(jsonb_agg(distinct jsonb_build_object('nome', pf.nome, 'slug', pf.slug, 'foto', pf.foto_url,
                                                                        'creci', pf.creci, 'creci_uf', pf.creci_uf)), '[]'::jsonb)
                     from public.anuncios a join public.captacoes c on c.id = a.captacao_id join public.perfis pf on pf.id = c.corretor_id
                    where a.imobiliaria_id = im.id and a.publicado and c.status = 'ativa' and pf.slug is not null));
end $$;

-- ---------------------------------------------------------------------
-- 3. Contato pelo formulário do anúncio → lead do corretor responsável
