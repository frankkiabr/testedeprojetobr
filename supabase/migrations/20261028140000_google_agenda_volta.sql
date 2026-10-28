-- =====================================================================
-- FRANKKIA — Google Agenda, fase 2: mudanças feitas no Google voltam para a Frankkia
-- A cada 5 minutos a função google-agenda confere, um por um, só os eventos que a própria Frankkia criou
-- (nunca lista nem lê os outros eventos da agenda). Se a pessoa mudou o título, o horário ou o local,
-- ou excluiu o evento no Google, o compromisso na Frankkia acompanha.
-- =====================================================================
alter table public.compromissos add column if not exists google_atualizado timestamptz;

-- Mudança que veio do Google: grava sem mandar de volta para o Google (evita o vai e volta)
create or replace function public.aplicar_mudanca_google(
  p_compromisso uuid, p_titulo text, p_inicio timestamptz, p_fim timestamptz, p_local text,
  p_excluir boolean, p_atualizado timestamptz)
returns void language plpgsql security definer set search_path = public as $$
declare c public.compromissos%rowtype;
begin
  select * into c from public.compromissos where id = p_compromisso for update;
  if not found then return; end if;
  perform set_config('frankkia.origem_google', 'on', true);
  if p_excluir then
    delete from public.compromissos where id = c.id;
    -- Visita ligada a um lead: o lead fica sem data de visita (como ao excluir pela Frankkia)
    if c.tipo = 'visita' and c.lead_id is not null then
      update public.leads set visita_em = null where id = c.lead_id and visita_em = c.inicio;
    end if;
  else
    update public.compromissos
       set titulo = coalesce(nullif(trim(p_titulo), ''), titulo),
           inicio = p_inicio,
           fim = case when p_fim > p_inicio then p_fim else p_inicio + interval '1 hour' end,
           local = nullif(trim(coalesce(p_local, '')), ''),
           google_atualizado = p_atualizado
     where id = c.id;
    if c.tipo = 'visita' and c.lead_id is not null and p_inicio is distinct from c.inicio then
      update public.leads set visita_em = p_inicio where id = c.lead_id;
    end if;
  end if;
  perform set_config('frankkia.origem_google', 'off', true);
end $$;
revoke execute on function public.aplicar_mudanca_google(uuid, text, timestamptz, timestamptz, text, boolean, timestamptz)
  from public, anon, authenticated;

-- A fila para o Google ignora o que veio do próprio Google e a gravação dos campos de controle
create or replace function public.compromisso_para_google()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(current_setting('frankkia.origem_google', true), 'off') = 'on' then
    return case when tg_op = 'DELETE' then old else new end;
  end if;
  if tg_op = 'DELETE' then
    if old.google_evento_id is not null and exists (select 1 from public.google_conexoes where usuario_id = old.dono_id) then
      insert into public.google_sync_fila (compromisso_id, usuario_id, acao, evento_id)
      values (old.id, old.dono_id, 'excluir', old.google_evento_id)
      on conflict (compromisso_id) do update set acao = 'excluir', evento_id = excluded.evento_id, tentativas = 0, erro = null, criado_em = now();
    end if;
    return old;
  end if;
  if tg_op = 'UPDATE'
     and (to_jsonb(new) - 'google_evento_id' - 'google_atualizado') = (to_jsonb(old) - 'google_evento_id' - 'google_atualizado') then
    return new;
  end if;
  if exists (select 1 from public.google_conexoes where usuario_id = new.dono_id) then
    insert into public.google_sync_fila (compromisso_id, usuario_id, acao, evento_id)
    values (new.id, new.dono_id, 'salvar', new.google_evento_id)
    on conflict (compromisso_id) do update set acao = 'salvar', evento_id = excluded.evento_id, tentativas = 0, erro = null, criado_em = now();
  end if;
  return new;
end $$;

-- Rotina a cada 5 minutos: confere os eventos da Frankkia no Google de quem está conectado
select cron.unschedule('frankkia-google-agenda-volta') where exists (select 1 from cron.job where jobname = 'frankkia-google-agenda-volta');
select cron.schedule('frankkia-google-agenda-volta', '*/5 * * * *', $cron$
  select net.http_post(
    url := 'https://yvbbktrufoyhtiotholf.supabase.co/functions/v1/google-agenda',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"acao": "buscar"}'::jsonb
  ) where exists (select 1 from public.google_conexoes);
$cron$);
