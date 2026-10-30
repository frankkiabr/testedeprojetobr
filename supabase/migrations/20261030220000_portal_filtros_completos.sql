-- =====================================================================
-- FRANKKIA — Portal com filtros completos (no padrão do VivaReal/ZAP, para os campos baterem com o Canal Pro):
--  • mais tipos de imóvel (Residencial e Comercial);
--  • "imóvel novo" (lançamento) com a fase da obra: na planta, em construção, pronto para morar;
--  • os cartões do portal levam condomínio, características, lançamento e quantidade de fotos (filtros e "mais relevantes");
--  • páginas do corretor e da imobiliária mostram desde quando estão na Frankkia.
-- =====================================================================
alter table public.imoveis drop constraint if exists imoveis_categoria_check;
alter table public.imoveis add constraint imoveis_categoria_check check (categoria in (
  -- Residencial
  'Apartamento', 'Casa', 'Casa de condomínio', 'Chácara', 'Cobertura', 'Flat', 'Kitnet', 'Terreno', 'Sobrado',
  'Edifício residencial', 'Fazenda/Sítio',
  -- Comercial
  'Consultório', 'Galpão', 'Imóvel comercial', 'Terreno comercial', 'Loja', 'Sala comercial', 'Prédio inteiro'
));

alter table public.anuncios add column if not exists lancamento text
  check (lancamento is null or lancamento in ('na_planta', 'em_construcao', 'pronto'));
grant update (lancamento) on public.anuncios to authenticated;

-- Cartões do portal (busca, corretor e imobiliária)
create or replace function public.portal_cartoes(p_imob uuid, p_corretor uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(x.j order by x.publicado_em desc), '[]'::jsonb) from (
    select a.publicado_em, jsonb_build_object(
      'slug', a.slug, 'titulo', a.titulo, 'codigo', c.codigo, 'finalidade', c.finalidade, 'valor', c.valor,
      'area', c.area_m2, 'categoria', i.categoria, 'bairro', i.bairro, 'cidade', i.cidade, 'uf', i.uf,
      'quartos', a.quartos, 'banheiros', a.banheiros, 'vagas', a.vagas, 'publicado_em', a.publicado_em,
      'condominio', a.condominio, 'caracteristicas', a.caracteristicas, 'lancamento', a.lancamento,
      'descricao_tamanho', length(coalesce(a.descricao, '')),
      'fotos', (select count(*) from public.anuncio_fotos f where f.captacao_id = a.captacao_id),
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
    'creci_verificado', pf.creci_status = 'verificado', 'desde', pf.criado_em,
    'telefone', coalesce(nullif(pf.telefone, ''), im.telefone), 'redes', pf.redes,
    'imobiliaria', jsonb_build_object('nome', im.nome, 'slug', im.slug, 'logo', public.portal_logo(im.id), 'solo', im.plano = 'Solo'),
    'anuncios', v_cartoes)
    from public.imobiliarias im where im.id = v_imob);
end $$;

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
    'logo', public.portal_logo(im.id), 'solo', im.plano = 'Solo', 'creci_j', im.creci_j, 'desde', im.criado_em,
    'anuncios', v_cartoes,
    'corretores', (select coalesce(jsonb_agg(distinct jsonb_build_object('nome', pf.nome, 'slug', pf.slug, 'foto', pf.foto_url,
                                                                        'creci', pf.creci, 'creci_uf', pf.creci_uf,
                                                                        'creci_verificado', pf.creci_status = 'verificado')), '[]'::jsonb)
                     from public.anuncios a join public.captacoes c on c.id = a.captacao_id join public.perfis pf on pf.id = c.corretor_id
                    where a.imobiliaria_id = im.id and a.publicado and c.status = 'ativa' and pf.slug is not null));
end $$;
