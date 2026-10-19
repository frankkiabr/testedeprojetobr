-- =====================================================================
-- FRANKKIA — Etapas 4 e 5: arquivos, painel Frankkia real e teste grátis
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Academy: vídeo por link (YouTube/Vimeo "não listado") e documentos guardados no banco
-- ---------------------------------------------------------------------
alter table public.aulas add column if not exists video_url text;
alter table public.aulas drop constraint if exists aulas_formato_check;
alter table public.aulas drop constraint if exists aulas_check;
alter table public.aulas add constraint aulas_formato_check
  check (formato in ('MP4','MOV','YOUTUBE','VIMEO','PDF','DOC','DOCX'));
alter table public.aulas add constraint aulas_tipo_formato_check
  check ((tipo = 'video' and formato in ('MP4','MOV','YOUTUBE','VIMEO'))
      or (tipo = 'documento' and formato in ('PDF','DOC','DOCX')));
alter table public.aulas add constraint aulas_video_link_check
  check (formato not in ('YOUTUBE','VIMEO') or video_url ~ '^https://(www\.)?(youtube\.com|youtube-nocookie\.com|player\.vimeo\.com)/');

-- ---------------------------------------------------------------------
-- 2. Armazenamento de arquivos (cada imobiliária numa pasta com o próprio id)
--    academy: PDFs e Word (privado, até 20 MB) · marca: logo PNG (pública, até 5 MB)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('academy', 'academy', false, 20971520,
   array['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('marca', 'marca', true, 5242880, array['image/png'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Imobiliária dona do arquivo = primeira pasta do caminho
create or replace function public.pasta_imobiliaria(p_nome text)
returns uuid language plpgsql immutable as $$
begin
  return (string_to_array(p_nome, '/'))[1]::uuid;
exception when others then
  return null;
end $$;

create policy academy_leitura on storage.objects for select to authenticated
  using (bucket_id = 'academy' and public.is_member(public.pasta_imobiliaria(name)));
create policy academy_envio on storage.objects for insert to authenticated
  with check (bucket_id = 'academy' and public.is_admin(public.pasta_imobiliaria(name)));
create policy academy_exclusao on storage.objects for delete to authenticated
  using (bucket_id = 'academy' and public.is_admin(public.pasta_imobiliaria(name)));

create policy marca_envio on storage.objects for insert to authenticated
  with check (bucket_id = 'marca' and public.is_admin(public.pasta_imobiliaria(name)));
create policy marca_troca on storage.objects for update to authenticated
  using (bucket_id = 'marca' and public.is_admin(public.pasta_imobiliaria(name)));
create policy marca_exclusao on storage.objects for delete to authenticated
  using (bucket_id = 'marca' and public.is_admin(public.pasta_imobiliaria(name)));

-- ---------------------------------------------------------------------
-- 3. Teste grátis (ex.: 7 dias, contados a partir do primeiro acesso do administrador)
-- ---------------------------------------------------------------------
alter table public.imobiliarias add column if not exists teste_dias int check (teste_dias is null or teste_dias between 1 and 90);
alter table public.imobiliarias add column if not exists teste_ate timestamptz;

-- Acesso liberado = não suspensa e, se em teste, dentro do prazo
create or replace function public.imob_liberada(p_status text, p_teste_ate timestamptz)
returns boolean language sql immutable as $$
  select p_status <> 'suspensa' and not (p_status = 'teste' and p_teste_ate is not null and p_teste_ate < now());
$$;

create or replace function public.is_member(p_imob uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.membros m join public.imobiliarias i on i.id = m.imobiliaria_id
    where m.imobiliaria_id = p_imob and m.usuario_id = auth.uid() and m.ativo
      and public.imob_liberada(i.status, i.teste_ate));
$$;

create or replace function public.is_admin(p_imob uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.membros m join public.imobiliarias i on i.id = m.imobiliaria_id
    where m.imobiliaria_id = p_imob and m.usuario_id = auth.uid() and m.ativo and m.papel = 'admin'
      and public.imob_liberada(i.status, i.teste_ate));
$$;

-- Administrador da conta, mesmo com o teste vencido ou a conta suspensa (para contratar um plano)
create or replace function public.is_admin_conta(p_imob uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.membros
                 where imobiliaria_id = p_imob and usuario_id = auth.uid() and ativo and papel = 'admin');
$$;

-- Prazo do teste e plano: só a Frankkia altera
create or replace function public.proteger_imobiliaria()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(current_setting('frankkia.operacao_sistema', true), '') = 'on' then return new; end if;
  if not public.is_frankkia() and (
       new.plano is distinct from old.plano
    or new.limite_corretores is distinct from old.limite_corretores
    or new.status is distinct from old.status
    or new.cliente_desde is distinct from old.cliente_desde
    or new.teste_dias is distinct from old.teste_dias
    or new.teste_ate is distinct from old.teste_ate) then
    raise exception 'APENAS_FRANKKIA: plano, limite, status e teste são alterados pela equipe Frankkia' using errcode = 'P0001';
  end if;
  return new;
end $$;

-- Primeiro acesso do administrador: começa o teste grátis (se houver) ou ativa a conta
create or replace function public.aceitar_convite(
  p_token text, p_nome text, p_telefone text, p_aniversario date,
  p_creci text, p_creci_uf text, p_estagiario boolean)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  c        public.convites%rowtype;
  v_email  text;
  v_nome   text := trim(coalesce(p_nome, ''));
begin
  if auth.uid() is null then raise exception 'NAO_AUTENTICADO' using errcode = '42501'; end if;
  select * into c from public.convites where token = p_token and status = 'pendente' for update;
  if not found then raise exception 'CONVITE_INVALIDO' using errcode = 'P0002'; end if;
  select email into v_email from auth.users where id = auth.uid();
  if lower(v_email) <> lower(c.email) then raise exception 'EMAIL_DIFERENTE_DO_CONVITE' using errcode = '42501'; end if;
  if c.papel = 'corretor' and not coalesce(p_estagiario, false) and coalesce(trim(p_creci), '') = '' then
    raise exception 'CRECI_OBRIGATORIO' using errcode = 'P0001';
  end if;

  update public.convites set status = 'aceito', aceito_por = auth.uid() where id = c.id;
  update public.perfis set
    nome = v_nome,
    telefone = nullif(trim(p_telefone), ''),
    aniversario = p_aniversario,
    creci = nullif(trim(p_creci), ''),
    creci_uf = case when nullif(trim(p_creci), '') is null then null else upper(p_creci_uf) end,
    estagiario = coalesce(p_estagiario, false),
    iniciais = upper(left(split_part(v_nome, ' ', 1), 1) || left(split_part(v_nome, ' ', 2), 1))
  where id = auth.uid();
  insert into public.membros (imobiliaria_id, usuario_id, papel)
  values (c.imobiliaria_id, auth.uid(), c.papel)
  on conflict (imobiliaria_id, usuario_id) do update set ativo = true, papel = excluded.papel;
  if c.papel = 'admin' then
    perform set_config('frankkia.operacao_sistema', 'on', true);
    update public.imobiliarias
       set status = case when teste_dias is not null then 'teste' else 'ativa' end,
           teste_ate = case when teste_dias is not null then now() + make_interval(days => teste_dias) else null end
     where id = c.imobiliaria_id and status = 'aguardando';
    perform set_config('frankkia.operacao_sistema', 'off', true);
  end if;
  return c.imobiliaria_id;
end $$;

-- Frankkia cria a imobiliária (com ou sem teste grátis) e o convite do administrador
drop function if exists public.criar_imobiliaria(text, text, text, text, text);
create or replace function public.criar_imobiliaria(
  p_nome text, p_cidade text, p_cnpj text, p_plano text, p_admin_email text, p_teste_dias int default null)
returns table (imobiliaria_id uuid, token text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare
  v_imob   uuid;
  v_token  text;
  v_limite int;
begin
  if not public.is_frankkia() then raise exception 'APENAS_FRANKKIA' using errcode = '42501'; end if;
  select limite into v_limite from public.planos where nome = p_plano;
  if not found then raise exception 'PLANO_INVALIDO' using errcode = 'P0001'; end if;
  insert into public.imobiliarias (nome, cidade, cnpj, plano, limite_corretores, status, teste_dias)
  values (trim(p_nome), nullif(trim(p_cidade), ''), nullif(trim(p_cnpj), ''), p_plano, v_limite, 'aguardando', p_teste_dias)
  returning id into v_imob;
  insert into public.convites (imobiliaria_id, email, papel, criado_por)
  values (v_imob, lower(trim(p_admin_email)), 'admin', auth.uid())
  returning convites.token into v_token;
  return query select v_imob, v_token;
end $$;

-- Liberar plano pago: também encerra o teste grátis
create or replace function public.liberar_upgrade(p_pedido uuid)
returns void language plpgsql security definer set search_path = public as $$
declare pu public.pedidos_upgrade%rowtype;
begin
  if not public.is_frankkia() then raise exception 'APENAS_FRANKKIA' using errcode = '42501'; end if;
  select * into pu from public.pedidos_upgrade where id = p_pedido for update;
  if not found then raise exception 'PEDIDO_NAO_ENCONTRADO' using errcode = 'P0002'; end if;
  if pu.pagamento <> 'confirmado' or pu.liberado then raise exception 'PEDIDO_NAO_LIBERAVEL' using errcode = 'P0001'; end if;
  update public.imobiliarias
     set plano = pu.plano_novo,
         limite_corretores = (select limite from public.planos where nome = pu.plano_novo),
         status = case when status in ('teste','pagamento','aguardando') then 'ativa' else status end,
         teste_ate = null
   where id = pu.imobiliaria_id;
  update public.pedidos_upgrade set liberado = true, liberado_em = now() where id = p_pedido;
end $$;

-- ---------------------------------------------------------------------
-- 4. Pedidos de plano: o administrador pede mesmo com o teste vencido;
--    a Frankkia confirma o pagamento à mão enquanto a Stripe não está ligada
-- ---------------------------------------------------------------------
drop policy if exists upgrades_leitura on public.pedidos_upgrade;
drop policy if exists upgrades_insercao on public.pedidos_upgrade;
create policy upgrades_leitura on public.pedidos_upgrade for select to authenticated
  using (public.is_admin_conta(imobiliaria_id) or public.is_frankkia());
create policy upgrades_insercao on public.pedidos_upgrade for insert to authenticated
  with check (public.is_admin_conta(imobiliaria_id) and pagamento = 'aguardando' and not liberado and criado_por = auth.uid());
create policy upgrades_admin_edicao on public.pedidos_upgrade for update to authenticated
  using (public.is_admin_conta(imobiliaria_id) and pagamento = 'aguardando' and not liberado)
  with check (public.is_admin_conta(imobiliaria_id) and pagamento in ('aguardando','cancelado') and not liberado);
create policy upgrades_frankkia_edicao on public.pedidos_upgrade for update to authenticated
  using (public.is_frankkia()) with check (public.is_frankkia());

-- ---------------------------------------------------------------------
-- 5. Painel Frankkia: dados de conta e volumes de uso (nunca o conteúdo)
-- ---------------------------------------------------------------------
create or replace function public.painel_imobiliarias()
returns table (
  id uuid, nome text, cidade text, cnpj text, plano text, status text, cliente_desde timestamptz,
  teste_ate timestamptz, teste_dias int, ultimo_acesso timestamptz, admin_nome text, admin_email text,
  vagas int, uso_negocios int, uso_performance int, uso_academy int, uso_marketing int)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare v_desde timestamptz := now() - interval '30 days';
begin
  if not public.is_frankkia() then raise exception 'APENAS_FRANKKIA' using errcode = '42501'; end if;
  return query
  select i.id, i.nome, coalesce(i.cidade, ''), coalesce(i.cnpj, ''), i.plano, i.status, i.cliente_desde,
    i.teste_ate, i.teste_dias,
    (select max(u.last_sign_in_at) from public.membros m join auth.users u on u.id = m.usuario_id where m.imobiliaria_id = i.id),
    coalesce((select p.nome from public.membros m join public.perfis p on p.id = m.usuario_id
              where m.imobiliaria_id = i.id and m.papel = 'admin' and m.ativo order by m.criado_em limit 1), ''),
    coalesce((select p.email from public.membros m join public.perfis p on p.id = m.usuario_id
              where m.imobiliaria_id = i.id and m.papel = 'admin' and m.ativo order by m.criado_em limit 1),
             (select c.email from public.convites c where c.imobiliaria_id = i.id and c.papel = 'admin'
              order by c.enviado_em desc limit 1), ''),
    public.vagas_em_uso(i.id),
    ((select count(*) from public.leads l where l.imobiliaria_id = i.id and l.criado_em >= v_desde)
     + (select count(*) from public.captacoes c where c.imobiliaria_id = i.id and c.captado_em >= v_desde)
     + (select count(*) from public.proprietarios p where p.imobiliaria_id = i.id and p.criado_em >= v_desde))::int,
    ((select count(*) from public.transacoes t where t.imobiliaria_id = i.id and t.criado_em >= v_desde)
     + (select count(*) from public.fechamentos_informados f where f.imobiliaria_id = i.id and f.criado_em >= v_desde))::int,
    (select count(*) from public.progresso_aulas a where a.imobiliaria_id = i.id and a.concluida_em >= v_desde)::int,
    (select count(*) from public.captacoes c where c.imobiliaria_id = i.id and c.captado_em >= v_desde
       and true = any (c.checklist_marketing))::int
  from public.imobiliarias i
  order by i.nome;
end $$;

revoke execute on all functions in schema public from public, anon;
grant  execute on all functions in schema public to authenticated, service_role;
grant  execute on function public.ver_convite(text) to anon;
