-- =====================================================================
-- FRANKKIA — Google Agenda de verdade (Frankkia → Google)
-- Cada pessoa conecta a própria conta Google (OAuth). Os compromissos dela criados, alterados ou excluídos
-- na Frankkia entram numa fila; a cada minuto a função google-agenda leva a fila para o Google Agenda.
-- O token do Google só é lido pelas funções do servidor (nenhuma regra de acesso para o app).
-- =====================================================================
create table if not exists public.google_conexoes (
  usuario_id    uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  refresh_token text not null,
  conectado_em  timestamptz not null default now()
);
alter table public.google_conexoes enable row level security;
revoke all on public.google_conexoes from anon, authenticated;

-- "state" do OAuth: liga a volta do Google à pessoa que clicou em conectar (vale 15 minutos)
create table if not exists public.google_oauth_estados (
  estado     text primary key,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  origem     text not null,
  criado_em  timestamptz not null default now()
);
alter table public.google_oauth_estados enable row level security;
revoke all on public.google_oauth_estados from anon, authenticated;

alter table public.compromissos add column if not exists google_evento_id text;

-- Fila de sincronização (uma linha por compromisso; a mais recente vale)
create table if not exists public.google_sync_fila (
  compromisso_id uuid primary key,
  usuario_id     uuid not null,
  acao           text not null check (acao in ('salvar', 'excluir')),
  evento_id      text,
  tentativas     int not null default 0,
  erro           text,
  criado_em      timestamptz not null default now()
);
alter table public.google_sync_fila enable row level security;
revoke all on public.google_sync_fila from anon, authenticated;

-- Para o app saber se a pessoa está conectada (sem expor o token)
create or replace function public.minha_conexao_google()
returns table (email text, conectado_em timestamptz)
language sql stable security definer set search_path = public as $$
  select g.email, g.conectado_em from public.google_conexoes g where g.usuario_id = auth.uid();
$$;
revoke execute on function public.minha_conexao_google() from public, anon;
grant execute on function public.minha_conexao_google() to authenticated;

-- Compromisso mudou: entra na fila se o dono estiver conectado
create or replace function public.compromisso_para_google()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    if old.google_evento_id is not null and exists (select 1 from public.google_conexoes where usuario_id = old.dono_id) then
      insert into public.google_sync_fila (compromisso_id, usuario_id, acao, evento_id)
      values (old.id, old.dono_id, 'excluir', old.google_evento_id)
      on conflict (compromisso_id) do update set acao = 'excluir', evento_id = excluded.evento_id, tentativas = 0, erro = null, criado_em = now();
    end if;
    return old;
  end if;
  -- Só a gravação do código do evento (feita pela própria sincronização) não volta para a fila
  if tg_op = 'UPDATE' and (to_jsonb(new) - 'google_evento_id') = (to_jsonb(old) - 'google_evento_id') then
    return new;
  end if;
  if exists (select 1 from public.google_conexoes where usuario_id = new.dono_id) then
    insert into public.google_sync_fila (compromisso_id, usuario_id, acao, evento_id)
    values (new.id, new.dono_id, 'salvar', new.google_evento_id)
    on conflict (compromisso_id) do update set acao = 'salvar', evento_id = excluded.evento_id, tentativas = 0, erro = null, criado_em = now();
  end if;
  return new;
end $$;
drop trigger if exists compromissos_google on public.compromissos;
create trigger compromissos_google after insert or update or delete on public.compromissos
  for each row execute function public.compromisso_para_google();

-- Ao conectar: os compromissos futuros da pessoa vão para o Google
create or replace function public.google_enfileirar_futuros(p_usuario uuid)
returns void language sql security definer set search_path = public as $$
  insert into public.google_sync_fila (compromisso_id, usuario_id, acao, evento_id)
  select c.id, c.dono_id, 'salvar', c.google_evento_id from public.compromissos c
   where c.dono_id = p_usuario and c.fim > now()
  on conflict (compromisso_id) do nothing;
$$;
revoke execute on function public.google_enfileirar_futuros(uuid) from public, anon, authenticated;

-- Rotina a cada minuto: leva a fila para o Google (só chama a função se houver algo)
select cron.unschedule('frankkia-google-agenda') where exists (select 1 from cron.job where jobname = 'frankkia-google-agenda');
select cron.schedule('frankkia-google-agenda', '* * * * *', $cron$
  select net.http_post(
    url := 'https://yvbbktrufoyhtiotholf.supabase.co/functions/v1/google-agenda',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"acao": "sincronizar"}'::jsonb
  ) where exists (select 1 from public.google_sync_fila where tentativas < 5);
$cron$);
