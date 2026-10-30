-- =====================================================================
-- FRANKKIA — CRECI conferido pela Frankkia. Não há API oficial (COFECI/CRECIs): a Frankkia consulta o site do
-- CRECI do estado e marca "verificado" (selo no portal) ou "irregular" (anúncios saem do portal e o corretor
-- vê um aviso para corrigir). Mudou o número ou o estado: volta para "pendente" e entra de novo na fila.
-- =====================================================================
alter table public.perfis
  add column if not exists creci_status text not null default 'pendente'
    check (creci_status in ('pendente', 'verificado', 'irregular')),
  add column if not exists creci_conferido_em timestamptz,
  add column if not exists creci_obs text check (creci_obs is null or length(creci_obs) <= 300);

-- Só a Frankkia muda a situação; trocar o CRECI volta para "pendente"
create or replace function public.proteger_creci_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.creci is distinct from old.creci or new.creci_uf is distinct from old.creci_uf then
    new.creci_status := 'pendente';
    new.creci_conferido_em := null;
    new.creci_obs := null;
  elsif (new.creci_status, new.creci_conferido_em, new.creci_obs) is distinct from (old.creci_status, old.creci_conferido_em, old.creci_obs)
        and not public.is_frankkia() then
    new.creci_status := old.creci_status;
    new.creci_conferido_em := old.creci_conferido_em;
    new.creci_obs := old.creci_obs;
  end if;
  return new;
end $$;
drop trigger if exists perfis_creci_status on public.perfis;
create trigger perfis_creci_status before update on public.perfis
  for each row execute function public.proteger_creci_status();

-- Com CRECI irregular, nenhum anúncio do corretor vai ao portal da Frankkia nem aos portais (Canal Pro)
create or replace function public.bloquear_anuncio_creci_irregular()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.publicado and (tg_op = 'INSERT' or not old.publicado)) or (new.portais and (tg_op = 'INSERT' or not old.portais)) then
    if exists (select 1 from public.captacoes c join public.perfis pf on pf.id = c.corretor_id
                where c.id = new.captacao_id and pf.creci_status = 'irregular') then
      raise exception 'CRECI_IRREGULAR: o CRECI do corretor não foi confirmado no conselho. Corrija em Configurações → Perfil' using errcode = 'P0001';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists anuncios_creci_irregular on public.anuncios;
create trigger anuncios_creci_irregular before insert or update on public.anuncios
  for each row execute function public.bloquear_anuncio_creci_irregular();

-- Painel Frankkia: quem tem CRECI (só dados de conta)
create or replace function public.painel_creci()
returns table (usuario_id uuid, nome text, email text, creci text, creci_uf text, status text, conferido_em timestamptz,
               obs text, imobiliaria text, plano text, desde timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_frankkia() then raise exception 'APENAS_FRANKKIA' using errcode = '42501'; end if;
  return query
    select distinct on (p.id) p.id, coalesce(nullif(p.nome, ''), p.email), p.email, p.creci, p.creci_uf, p.creci_status,
           p.creci_conferido_em, p.creci_obs, i.nome, i.plano, m.criado_em
      from public.perfis p
      join public.membros m on m.usuario_id = p.id and m.ativo
      join public.imobiliarias i on i.id = m.imobiliaria_id
     where coalesce(trim(p.creci), '') <> ''
     order by p.id, m.criado_em;
end $$;
revoke execute on function public.painel_creci() from public, anon;
grant execute on function public.painel_creci() to authenticated;

-- Frankkia marca a situação. Irregular tira os anúncios do corretor do portal e dos portais.
create or replace function public.conferir_creci(p_usuario uuid, p_status text, p_obs text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_frankkia() then raise exception 'APENAS_FRANKKIA' using errcode = '42501'; end if;
  if p_status not in ('pendente', 'verificado', 'irregular') then raise exception 'STATUS_INVALIDO' using errcode = 'P0001'; end if;
  update public.perfis
     set creci_status = p_status,
         creci_conferido_em = case when p_status = 'pendente' then null else now() end,
         creci_obs = case when p_status = 'irregular' then nullif(trim(coalesce(p_obs, '')), '') end
   where id = p_usuario;
  if p_status = 'irregular' then
    update public.anuncios a set publicado = false, portais = false
      from public.captacoes c
     where c.id = a.captacao_id and c.corretor_id = p_usuario and (a.publicado or a.portais);
  end if;
end $$;
revoke execute on function public.conferir_creci(uuid, text, text) from public, anon;
grant execute on function public.conferir_creci(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------
-- Portal: selo "CRECI verificado"
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
                                   'creci_uf', pf.creci_uf, 'creci_verificado', pf.creci_status = 'verificado',
                                   'telefone', coalesce(nullif(pf.telefone, ''), im.telefone)),
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
    'creci_verificado', pf.creci_status = 'verificado',
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
    'logo', public.portal_logo(im.id), 'solo', im.plano = 'Solo', 'creci_j', im.creci_j,
    'anuncios', v_cartoes,
    'corretores', (select coalesce(jsonb_agg(distinct jsonb_build_object('nome', pf.nome, 'slug', pf.slug, 'foto', pf.foto_url,
                                                                        'creci', pf.creci, 'creci_uf', pf.creci_uf,
                                                                        'creci_verificado', pf.creci_status = 'verificado')), '[]'::jsonb)
                     from public.anuncios a join public.captacoes c on c.id = a.captacao_id join public.perfis pf on pf.id = c.corretor_id
                    where a.imobiliaria_id = im.id and a.publicado and c.status = 'ativa' and pf.slug is not null));
end $$;
