-- =====================================================================
-- FRANKKIA — Rodízio de leads (planos de equipe), no estilo "A Vez".
-- O administrador cadastra ou importa leads "no rodízio": cada um vai para o próximo corretor da fila
-- (quem recebeu há mais tempo). Com prazo ligado, se o corretor não fizer o primeiro contato a tempo,
-- o lead passa para o próximo; se passar por todos, volta para o administrador.
-- Leads do portal continuam indo para o corretor do anúncio.
-- =====================================================================

alter table public.imobiliarias
  add column if not exists rodizio_ativo boolean not null default false,
  add column if not exists rodizio_minutos integer check (rodizio_minutos is null or rodizio_minutos between 5 and 1440),
  add column if not exists rodizio_fora uuid[] not null default '{}';

alter table public.leads
  add column if not exists rodizio boolean not null default false,
  add column if not exists atribuido_em timestamptz,
  add column if not exists passou_por uuid[] not null default '{}',
  add column if not exists voltou_ao_admin boolean not null default false;

-- O repasse automático é o único caminho, além do administrador, que troca o responsável de um lead
create or replace function public.proteger_dono()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_col text := tg_argv[0];
begin
  if (to_jsonb(new) ->> v_col) is distinct from (to_jsonb(old) ->> v_col)
     and not public.is_admin(new.imobiliaria_id)
     and coalesce(current_setting('frankkia.repasse', true), '') <> '1' then
    raise exception 'APENAS_ADMIN: só o administrador muda o responsável' using errcode = 'P0001';
  end if;
  return new;
end $$;

-- Fila: corretores ativos que participam, de quem recebeu lead do rodízio há mais tempo para quem recebeu agora
create or replace function public._fila_rodizio(p_imob uuid)
returns uuid[] language sql stable security definer set search_path = public as $$
  select coalesce(array_agg(m.usuario_id order by x.ultimo nulls first, m.criado_em), '{}')
  from public.membros m
  join public.imobiliarias i on i.id = m.imobiliaria_id
  left join lateral (
    select max(l.atribuido_em) as ultimo from public.leads l
    where l.imobiliaria_id = p_imob and l.rodizio and (l.corretor_id = m.usuario_id or m.usuario_id = any (l.passou_por))
  ) x on true
  where m.imobiliaria_id = p_imob and m.papel = 'corretor' and m.ativo and not (m.usuario_id = any (i.rodizio_fora));
$$;
revoke execute on function public._fila_rodizio(uuid) from public, anon, authenticated;

create or replace function public.fila_rodizio(p_imob uuid)
returns uuid[] language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin(p_imob) then raise exception 'APENAS_ADMIN' using errcode = '42501'; end if;
  return public._fila_rodizio(p_imob);
end $$;
revoke execute on function public.fila_rodizio(uuid) from public, anon;
grant execute on function public.fila_rodizio(uuid) to authenticated;

create or replace function public.configurar_rodizio(p_imob uuid, p_ativo boolean, p_minutos integer, p_fora uuid[])
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin(p_imob) then raise exception 'APENAS_ADMIN' using errcode = '42501'; end if;
  update public.imobiliarias
     set rodizio_ativo = coalesce(p_ativo, false), rodizio_minutos = p_minutos, rodizio_fora = coalesce(p_fora, '{}')
   where id = p_imob;
end $$;
revoke execute on function public.configurar_rodizio(uuid, boolean, integer, uuid[]) from public, anon;
grant execute on function public.configurar_rodizio(uuid, boolean, integer, uuid[]) to authenticated;

-- Repasse por prazo: chamado pelo agendador a cada 5 minutos. Lead "atendido" = algum passo do checklist,
-- contato registrado ou etapa diferente de "Novo". Leads com documentos anexados não mudam de dono.
create or replace function public.rodizio_repassar()
returns integer language plpgsql security definer set search_path = public as $$
declare
  r record;
  v_prox uuid;
  v_admin uuid;
  v_n integer := 0;
begin
  perform set_config('frankkia.repasse', '1', true);
  for r in
    select l.id, l.imobiliaria_id, l.corretor_id, l.passou_por
    from public.leads l
    join public.imobiliarias i on i.id = l.imobiliaria_id
    where l.rodizio and not l.voltou_ao_admin
      and i.rodizio_ativo and i.rodizio_minutos is not null
      and public.imob_liberada(i.status, i.teste_ate)
      and l.etapa = 'novo' and l.ultimo_contato is null and not (true = any (l.checklist))
      and l.atribuido_em < now() - make_interval(mins => i.rodizio_minutos)
      and not exists (select 1 from public.documentos d where d.tipo = 'lead' and d.ref_id = l.id)
    for update of l skip locked
  loop
    select f into v_prox from unnest(public._fila_rodizio(r.imobiliaria_id)) f
     where f <> r.corretor_id and not (f = any (r.passou_por)) limit 1;
    if v_prox is not null then
      update public.leads set passou_por = passou_por || r.corretor_id, corretor_id = v_prox, atribuido_em = now() where id = r.id;
    else
      select m.usuario_id into v_admin from public.membros m
       where m.imobiliaria_id = r.imobiliaria_id and m.papel = 'admin' and m.ativo order by m.criado_em limit 1;
      if v_admin is null then continue; end if;
      update public.leads
         set passou_por = passou_por || r.corretor_id, corretor_id = v_admin, atribuido_em = now(), voltou_ao_admin = true
       where id = r.id;
    end if;
    v_n := v_n + 1;
  end loop;
  return v_n;
end $$;
revoke execute on function public.rodizio_repassar() from public, anon, authenticated;

select cron.unschedule('frankkia-rodizio') where exists (select 1 from cron.job where jobname = 'frankkia-rodizio');
select cron.schedule('frankkia-rodizio', '*/5 * * * *', $cron$ select public.rodizio_repassar(); $cron$);
