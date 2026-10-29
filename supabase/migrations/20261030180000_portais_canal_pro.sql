-- =====================================================================
-- FRANKKIA — Envio dos anúncios ao Canal Pro (ZAP Imóveis, VivaReal e OLX), em beta.
-- A Frankkia gera um arquivo XML no padrão VRSync do Grupo OLX, por imobiliária, num link secreto.
-- A imobiliária cola o link no Canal Pro (contrato dela com o Grupo OLX) e ele publica nos portais.
-- =====================================================================

-- Cada anúncio escolhe se vai para os portais e o tipo de destaque contratado no Canal Pro
alter table public.anuncios
  add column if not exists portais boolean not null default false,
  add column if not exists portais_destaque text not null default 'STANDARD'
    check (portais_destaque in ('STANDARD', 'PREMIUM', 'SUPER_PREMIUM'));
grant update (portais, portais_destaque) on public.anuncios to authenticated;

-- Os portais só aceitam JPG: cada foto nova ganha também uma versão JPG
alter table public.anuncio_fotos add column if not exists url_jpg text;

-- Link secreto do arquivo, um por imobiliária (só o administrador vê)
create table if not exists public.feeds_portais (
  imobiliaria_id uuid primary key references public.imobiliarias(id) on delete cascade,
  token          text not null unique default replace(gen_random_uuid()::text, '-', ''),
  criado_em      timestamptz not null default now()
);
alter table public.feeds_portais enable row level security;
drop policy if exists feeds_portais_leitura on public.feeds_portais;
create policy feeds_portais_leitura on public.feeds_portais for select to authenticated using (public.is_admin(imobiliaria_id));

-- Devolve o código do link (cria na primeira vez); com p_novo, troca o código (o link antigo para de funcionar)
create or replace function public.link_portais(p_imob uuid, p_novo boolean default false)
returns text language plpgsql security definer set search_path = public as $$
declare v_token text;
begin
  if not public.is_admin(p_imob) then raise exception 'APENAS_ADMIN' using errcode = '42501'; end if;
  insert into public.feeds_portais (imobiliaria_id) values (p_imob) on conflict (imobiliaria_id) do nothing;
  if p_novo then
    update public.feeds_portais set token = replace(gen_random_uuid()::text, '-', ''), criado_em = now() where imobiliaria_id = p_imob;
  end if;
  select token into v_token from public.feeds_portais where imobiliaria_id = p_imob;
  return v_token;
end $$;
revoke execute on function public.link_portais(uuid, boolean) from public, anon;
grant execute on function public.link_portais(uuid, boolean) to authenticated;

-- Dados do arquivo (lidos só pela função feed-portais, com a chave de serviço): imóveis ativos marcados para os portais
create or replace function public.feed_portais(p_token text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'imobiliaria', jsonb_build_object('nome', im.nome, 'email', im.email, 'telefone', im.telefone, 'logo', public.portal_logo(im.id)),
    'imoveis', coalesce((
      select jsonb_agg(jsonb_build_object(
        'codigo', c.codigo, 'finalidade', c.finalidade, 'valor', c.valor, 'area', c.area_m2, 'unidade', c.unidade,
        'categoria', i.categoria, 'logradouro', i.logradouro, 'numero', i.numero, 'bairro', i.bairro, 'cidade', i.cidade,
        'uf', i.uf, 'cep', i.cep, 'lat', i.lat, 'lng', i.lng,
        'titulo', a.titulo, 'descricao', a.descricao, 'quartos', a.quartos, 'suites', a.suites, 'banheiros', a.banheiros,
        'vagas', a.vagas, 'condominio', a.condominio, 'iptu', a.iptu, 'caracteristicas', a.caracteristicas,
        'destaque', a.portais_destaque, 'atualizado_em', a.atualizado_em,
        'fotos', (select coalesce(jsonb_agg(f.url_jpg order by f.ordem), '[]'::jsonb)
                  from public.anuncio_fotos f where f.captacao_id = c.id and f.url_jpg is not null),
        'corretor', jsonb_build_object('nome', pf.nome, 'email', pf.email, 'telefone', coalesce(nullif(pf.telefone, ''), im.telefone))
      ) order by c.codigo)
      from public.anuncios a
      join public.captacoes c on c.id = a.captacao_id
      join public.imoveis i on i.id = c.imovel_id
      join public.perfis pf on pf.id = c.corretor_id
      where a.imobiliaria_id = im.id and a.portais and c.status = 'ativa'
    ), '[]'::jsonb)
  )
  from public.feeds_portais fp
  join public.imobiliarias im on im.id = fp.imobiliaria_id
  where fp.token = p_token and public.imob_liberada(im.status, im.teste_ate);
$$;
revoke execute on function public.feed_portais(text) from public, anon, authenticated;
