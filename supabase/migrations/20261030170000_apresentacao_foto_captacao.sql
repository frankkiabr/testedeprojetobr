-- Apresentação do estudo: sem foto própria, usa a primeira foto do anúncio da captação ligada ao estudo.
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
    'foto', coalesce(a.foto_url, (select fo.url from public.anuncio_fotos fo where fo.captacao_id = a.captacao_id order by fo.ordem limit 1)), 'lat', a.lat, 'lng', a.lng,
    -- Só o primeiro nome, para a saudação
    'proprietario', nullif(split_part(trim(coalesce(pr.nome, '')), ' ', 1), ''),
    'etapas', jsonb_build_object('visita', a.data_visita is not null, 'apresentado', a.apresentado,
                                 'exclusividade', a.exclusividade, 'vendido', a.vendido),
    'amostras', (select coalesce(jsonb_agg(jsonb_build_object(
                    'valor', s.valor, 'area', s.area_m2, 'quartos', s.quartos, 'suites', s.suites, 'banheiros', s.banheiros,
                    'vagas', s.vagas, 'bairro', s.bairro, 'endereco', coalesce(s.endereco, s.titulo), 'foto', s.foto_url,
                    'origem', s.origem, 'ano', s.ano_construcao, 'portaria', s.portaria, 'infra', s.infraestrutura,
                    'url', s.url, 'portal', s.portal) order by s.criado_em), '[]'::jsonb)
                   from public.avaliacao_amostras s where s.avaliacao_id = a.id and s.usar),
    'corretor', jsonb_build_object('nome', pf.nome, 'foto', pf.foto_url, 'creci', pf.creci, 'creci_uf', pf.creci_uf,
                                   'telefone', coalesce(nullif(pf.telefone, ''), im.telefone), 'slug', pf.slug, 'bio', pf.bio),
    'imobiliaria', jsonb_build_object('nome', im.nome, 'logo', public.portal_logo(im.id), 'solo', im.plano = 'Solo',
                                      'creci_j', im.creci_j)
  )
  from public.avaliacoes a
  join public.imobiliarias im on im.id = a.imobiliaria_id
  join public.perfis pf on pf.id = a.corretor_id
  left join public.proprietarios pr on pr.id = a.proprietario_id
  where a.token = p_token and a.link_liberado and public.imob_liberada(im.status, im.teste_ate)
  limit 1;
$$;
