-- =====================================================================
-- FRANKKIA — Documentos por cliente (lead e proprietário): RG, comprovantes, contratos, matrícula...
-- Arquivos no armazenamento privado "documentos", na pasta <imobiliária>/<corretor>/<tipo>/<cliente>/.
-- Quem vê o documento é quem vê o cliente: o próprio corretor e o administrador. A Frankkia nunca vê.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('documentos', 'documentos', false, 15728640,
   array['application/pdf','image/jpeg','image/png','image/webp','image/heic','image/heif',
         'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
         'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.documentos (
  id             uuid primary key default gen_random_uuid(),
  imobiliaria_id uuid not null references public.imobiliarias(id) on delete cascade,
  corretor_id    uuid not null references auth.users(id),
  tipo           text not null check (tipo in ('lead','proprietario')),
  ref_id         uuid not null,
  nome           text not null check (length(trim(nome)) between 1 and 200),
  caminho        text not null unique check (length(caminho) <= 500),
  tamanho        integer not null default 0 check (tamanho between 0 and 15728640),
  mime           text check (mime is null or length(mime) <= 120),
  enviado_por    uuid default auth.uid(),
  criado_em      timestamptz not null default now()
);
create index if not exists documentos_cliente_idx on public.documentos (tipo, ref_id, criado_em desc);

alter table public.documentos enable row level security;

-- O documento precisa ser de um cliente que existe, desta imobiliária e deste corretor, e o caminho precisa
-- estar na pasta certa (assim ninguém registra arquivo na pasta de outra pessoa).
create or replace function public.documento_valido(p_imob uuid, p_corretor uuid, p_tipo text, p_ref uuid, p_caminho text)
returns boolean language sql stable security definer set search_path = public as $$
  select p_caminho like p_imob::text || '/' || p_corretor::text || '/' || p_tipo || '/' || p_ref::text || '/%'
    and case p_tipo
      when 'lead' then exists (select 1 from public.leads l where l.id = p_ref and l.imobiliaria_id = p_imob and l.corretor_id = p_corretor)
      when 'proprietario' then exists (select 1 from public.proprietarios p where p.id = p_ref and p.imobiliaria_id = p_imob and p.corretor_id = p_corretor)
      else false end;
$$;
revoke execute on function public.documento_valido(uuid, uuid, text, uuid, text) from public, anon;
grant execute on function public.documento_valido(uuid, uuid, text, uuid, text) to authenticated;

drop policy if exists documentos_leitura on public.documentos;
drop policy if exists documentos_envio on public.documentos;
drop policy if exists documentos_exclusao on public.documentos;
create policy documentos_leitura on public.documentos for select to authenticated
  using (public.is_admin(imobiliaria_id) or (corretor_id = auth.uid() and public.is_member(imobiliaria_id)));
create policy documentos_envio on public.documentos for insert to authenticated
  with check ((public.is_admin(imobiliaria_id) or (corretor_id = auth.uid() and public.is_member(imobiliaria_id)))
    and public.documento_valido(imobiliaria_id, corretor_id, tipo, ref_id, caminho));
create policy documentos_exclusao on public.documentos for delete to authenticated
  using (public.is_admin(imobiliaria_id) or (corretor_id = auth.uid() and public.is_member(imobiliaria_id)));

-- Arquivos: 1ª pasta = imobiliária, 2ª pasta = corretor dono do cliente
drop policy if exists documentos_arq_leitura on storage.objects;
drop policy if exists documentos_arq_envio on storage.objects;
drop policy if exists documentos_arq_exclusao on storage.objects;
create policy documentos_arq_leitura on storage.objects for select to authenticated
  using (bucket_id = 'documentos' and (public.is_admin(public.pasta_imobiliaria(name))
    or ((storage.foldername(name))[2] = auth.uid()::text and public.is_member(public.pasta_imobiliaria(name)))));
create policy documentos_arq_envio on storage.objects for insert to authenticated
  with check (bucket_id = 'documentos' and (public.is_admin(public.pasta_imobiliaria(name))
    or ((storage.foldername(name))[2] = auth.uid()::text and public.is_member(public.pasta_imobiliaria(name)))));
create policy documentos_arq_exclusao on storage.objects for delete to authenticated
  using (bucket_id = 'documentos' and (public.is_admin(public.pasta_imobiliaria(name))
    or ((storage.foldername(name))[2] = auth.uid()::text and public.is_member(public.pasta_imobiliaria(name)))));
