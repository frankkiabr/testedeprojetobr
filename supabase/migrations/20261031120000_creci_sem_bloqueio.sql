-- =====================================================================
-- FRANKKIA — CRECI irregular não bloqueia mais nada: o corretor publica normalmente e só recebe o aviso no sino.
-- O selo "CRECI verificado" continua no portal e em Configurações → Perfil.
-- =====================================================================
drop trigger if exists anuncios_creci_irregular on public.anuncios;
drop function if exists public.bloquear_anuncio_creci_irregular();

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
end $$;
