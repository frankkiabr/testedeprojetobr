-- =====================================================================
-- FRANKKIA — Redes sociais do corretor (Configurações → Meu perfil), mostradas na página pública dele
-- Formato: {"instagram": "https://...", "facebook": "...", "linkedin": "...", "tiktok": "...", "youtube": "...", "site": "..."}
-- =====================================================================
create or replace function public.redes_validas(r jsonb)
returns boolean language sql immutable as $$
  select jsonb_typeof(r) = 'object'
     and r - array['instagram','facebook','linkedin','tiktok','youtube','site'] = '{}'::jsonb
     and not exists (select 1 from jsonb_each(r) e
                      where jsonb_typeof(e.value) <> 'string' or e.value #>> '{}' !~ '^https://' or length(e.value #>> '{}') > 300);
$$;

alter table public.perfis add column if not exists redes jsonb not null default '{}'::jsonb;
alter table public.perfis drop constraint if exists perfis_redes_formato;
alter table public.perfis add constraint perfis_redes_formato check (public.redes_validas(redes));

-- Página do corretor: agora também traz as redes sociais
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
    'telefone', coalesce(nullif(pf.telefone, ''), im.telefone), 'redes', pf.redes,
    'imobiliaria', jsonb_build_object('nome', im.nome, 'slug', im.slug, 'logo', public.portal_logo(im.id), 'solo', im.plano = 'Solo'),
    'anuncios', v_cartoes)
    from public.imobiliarias im where im.id = v_imob);
end $$;
