-- =====================================================================
-- FRANKKIA — Foto de perfil (pessoas e parceiros) e localização no mapa (imóveis e compromissos)
-- =====================================================================

-- Fotos de perfil: pequenas (≈30 KB), ficam no próprio Supabase, em pasta pública
alter table public.perfis add column if not exists foto_url text check (foto_url is null or foto_url ~ '^https://');
alter table public.parceiros add column if not exists foto_url text check (foto_url is null or foto_url ~ '^https://');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatares', 'avatares', true, 1048576, array['image/webp','image/jpeg','image/png'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Cada pessoa mexe só na própria pasta (<id do usuário>/...);
-- fotos de parceiros ficam em parceiros/<id da imobiliária>/... e só o administrador mexe.
create or replace function public.pode_mexer_avatar(p_nome text)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare partes text[] := string_to_array(p_nome, '/');
begin
  if partes[1] = 'parceiros' then
    return public.is_admin(public.pasta_imobiliaria(partes[2]));
  end if;
  return partes[1] = auth.uid()::text;
exception when others then
  return false;
end $$;

create policy avatares_envio on storage.objects for insert to authenticated
  with check (bucket_id = 'avatares' and public.pode_mexer_avatar(name));
create policy avatares_troca on storage.objects for update to authenticated
  using (bucket_id = 'avatares' and public.pode_mexer_avatar(name));
create policy avatares_exclusao on storage.objects for delete to authenticated
  using (bucket_id = 'avatares' and public.pode_mexer_avatar(name));

-- Localização: CEP e coordenadas (para mostrar o mapa e, no portal, buscar por região)
alter table public.imoveis add column if not exists cep text check (cep is null or cep ~ '^\d{8}$');
alter table public.imoveis add column if not exists lat double precision check (lat is null or lat between -90 and 90);
alter table public.imoveis add column if not exists lng double precision check (lng is null or lng between -180 and 180);

alter table public.compromissos add column if not exists local_lat double precision check (local_lat is null or local_lat between -90 and 90);
alter table public.compromissos add column if not exists local_lng double precision check (local_lng is null or local_lng between -180 and 180);

revoke execute on function public.pode_mexer_avatar(text) from public, anon;
grant execute on function public.pode_mexer_avatar(text) to authenticated;
