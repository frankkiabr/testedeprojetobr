-- =====================================================================
-- FRANKKIA — WhatsApp oficial (API da Meta)
-- 1) Avisos ao corretor pelo número da Frankkia (modelos de utilidade, sem IA):
--      lead_novo        lead novo atribuído a ele (cadastro, portal, rodízio ou repasse)
--      lead_rodizio     lead do rodízio, com o prazo para o primeiro contato
--      visita_lembrete  1 hora antes de uma visita/captação da agenda
--      chave_atrasada   chave que ele registrou e não foi devolvida no prazo
--    Só recebe quem ligou o aviso em Configurações → Notificações (perfis.avisos_whatsapp) e tem WhatsApp no perfil.
--    Fila whatsapp_avisos; a cada minuto o banco chama a função enviar-whatsapp.
-- 2) Conversas que chegam no número da Frankkia (venda e suporte): whatsapp_conversas + whatsapp_mensagens,
--    gravadas pela função whatsapp-webhook. Só a Frankkia lê.
-- Responder "PARAR" desliga os avisos daquele corretor.
-- =====================================================================

-- Quais avisos o usuário quer no WhatsApp (vazio = nenhum; ele liga na tela)
alter table public.perfis add column if not exists avisos_whatsapp text[] not null default '{}';

create or replace function public.configurar_avisos_whatsapp(p_tipos text[])
returns text[] language plpgsql security definer set search_path = public as $$
declare v text[];
begin
  if auth.uid() is null then raise exception 'NAO_AUTENTICADO'; end if;
  select coalesce(array_agg(distinct t), '{}') into v from unnest(coalesce(p_tipos, '{}')) t
   where t in ('lead', 'visita', 'chave');
  if cardinality(v) > 0 and not exists (
    select 1 from public.perfis where id = auth.uid() and length(regexp_replace(coalesce(telefone, ''), '\D', '', 'g')) >= 10
  ) then
    raise exception 'SEM_WHATSAPP';
  end if;
  update public.perfis set avisos_whatsapp = v where id = auth.uid();
  return v;
end $$;
revoke execute on function public.configurar_avisos_whatsapp(text[]) from public, anon;
grant execute on function public.configurar_avisos_whatsapp(text[]) to authenticated;

-- Número no formato internacional (55 + DDD + número), ou nulo se não der
create or replace function public.whatsapp_e164(p_tel text)
returns text language sql immutable as $$
  select case
    when length(d) in (10, 11) then '55' || d
    when d like '55%' and length(d) in (12, 13) then d
  end
  from (select regexp_replace(coalesce(p_tel, ''), '\D', '', 'g') as d) x;
$$;

-- ---------------------------------------------------------------------
-- Fila dos avisos
-- ---------------------------------------------------------------------
create table if not exists public.whatsapp_avisos (
  id             uuid primary key default gen_random_uuid(),
  imobiliaria_id uuid references public.imobiliarias(id) on delete cascade,
  usuario_id     uuid not null references auth.users(id) on delete cascade,
  tipo           text not null check (tipo in ('lead_novo', 'lead_rodizio', 'visita_lembrete', 'chave_atrasada')),
  chave          text not null unique,
  para           text not null,
  parametros     jsonb not null default '[]'::jsonb,   -- textos {{1}}, {{2}}... do modelo, em ordem
  tentativas     int not null default 0,
  erro           text,
  wamid          text,                                  -- identificação da mensagem na Meta
  situacao       text,                                  -- sent / delivered / read / failed (pelo webhook)
  enviado_em     timestamptz,
  criado_em      timestamptz not null default now()
);
create index if not exists whatsapp_avisos_pendentes_idx on public.whatsapp_avisos (criado_em) where enviado_em is null;
create index if not exists whatsapp_avisos_usuario_idx on public.whatsapp_avisos (usuario_id, criado_em);
create index if not exists whatsapp_avisos_wamid_idx on public.whatsapp_avisos (wamid);
alter table public.whatsapp_avisos enable row level security;
drop policy if exists whatsapp_avisos_frankkia on public.whatsapp_avisos;
create policy whatsapp_avisos_frankkia on public.whatsapp_avisos for select to authenticated using (public.is_frankkia());

-- Coloca um aviso na fila (nada acontece se o usuário não quer esse aviso, não tem WhatsApp ou a chave já existe)
create or replace function public.enfileirar_whatsapp(p_usuario uuid, p_imob uuid, p_tipo text, p_chave text, p_params jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_para text;
  v_quer text[];
  v_grupo text := case when p_tipo in ('lead_novo', 'lead_rodizio') then 'lead'
                       when p_tipo = 'visita_lembrete' then 'visita' else 'chave' end;
begin
  if p_usuario is null then return; end if;
  select public.whatsapp_e164(telefone), avisos_whatsapp into v_para, v_quer from public.perfis where id = p_usuario;
  if v_para is null or not (v_grupo = any (coalesce(v_quer, '{}'))) then return; end if;
  -- Conta sem acesso (teste acabou, suspensa ou só leitura) não recebe avisos
  if p_imob is not null and not exists (
    select 1 from public.imobiliarias i where i.id = p_imob and public.imob_liberada(i.status, i.teste_ate)
  ) then return; end if;
  -- Importação de planilha ou muitos leads de uma vez: no máximo 3 avisos de lead a cada 15 minutos por pessoa
  if v_grupo = 'lead' and (
    select count(*) from public.whatsapp_avisos
     where usuario_id = p_usuario and tipo in ('lead_novo', 'lead_rodizio') and criado_em > now() - interval '15 minutes'
  ) >= 3 then return; end if;
  insert into public.whatsapp_avisos (imobiliaria_id, usuario_id, tipo, chave, para, parametros)
  values (p_imob, p_usuario, p_tipo, p_chave, v_para, coalesce(p_params, '[]'::jsonb))
  on conflict (chave) do nothing;
end $$;
revoke execute on function public.enfileirar_whatsapp(uuid, uuid, text, text, jsonb) from public, anon, authenticated;

-- Primeiro nome de um usuário (para o "Olá, Fulano!")
create or replace function public._primeiro_nome(p_usuario uuid)
returns text language sql stable security definer set search_path = public as $$
  select coalesce(nullif(split_part(trim(nome), ' ', 1), ''), 'corretor') from public.perfis where id = p_usuario;
$$;
revoke execute on function public._primeiro_nome(uuid) from public, anon, authenticated;

-- Lead novo para alguém que não foi quem cadastrou (ou que mudou de dono: repasse do rodízio, troca pelo administrador)
create or replace function public.whatsapp_lead_novo()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_min int;
begin
  if tg_op = 'UPDATE' and new.corretor_id is not distinct from old.corretor_id then return new; end if;
  if new.corretor_id = auth.uid() then return new; end if;   -- cadastrou para si mesmo
  if new.rodizio then
    select rodizio_minutos into v_min from public.imobiliarias where id = new.imobiliaria_id and rodizio_ativo;
  end if;
  if v_min is not null and not new.voltou_ao_admin then
    perform public.enfileirar_whatsapp(new.corretor_id, new.imobiliaria_id, 'lead_rodizio',
      'lead:' || new.id || ':' || new.corretor_id,
      jsonb_build_array(public._primeiro_nome(new.corretor_id), new.nome,
                        coalesce(nullif(trim(new.interesse), ''), 'um imóvel'), v_min::text));
  else
    perform public.enfileirar_whatsapp(new.corretor_id, new.imobiliaria_id, 'lead_novo',
      'lead:' || new.id || ':' || new.corretor_id,
      jsonb_build_array(public._primeiro_nome(new.corretor_id), new.nome,
                        coalesce(nullif(trim(new.interesse), ''), 'um imóvel'),
                        coalesce(nullif(trim(new.origem), ''), 'Frankkia')));
  end if;
  return new;
end $$;
drop trigger if exists leads_whatsapp on public.leads;
create trigger leads_whatsapp after insert or update of corretor_id on public.leads
  for each row execute function public.whatsapp_lead_novo();

-- Lembretes de visita (1 hora antes) e chaves atrasadas: conferidos a cada minuto
create or replace function public.agendar_whatsapp()
returns void language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in
    select c.id, c.dono_id, c.imobiliaria_id, c.titulo, c.tipo, c.inicio, c.local
      from public.compromissos c
     where c.tipo in ('visita', 'captacao') and c.imobiliaria_id is not null
       and c.inicio > now() and c.inicio <= now() + interval '60 minutes'
  loop
    perform public.enfileirar_whatsapp(r.dono_id, r.imobiliaria_id, 'visita_lembrete',
      'visita:' || r.id || ':' || r.inicio,
      jsonb_build_array(public._primeiro_nome(r.dono_id),
                        r.titulo,
                        to_char(r.inicio at time zone 'America/Belem', 'HH24:MI'),
                        coalesce(nullif(trim(r.local), ''), 'não informado')));
  end loop;

  for r in
    select k.id, k.registrado_por, k.imobiliaria_id, k.com_quem, k.devolver_ate, cp.codigo
      from public.chaves k join public.captacoes cp on cp.id = k.captacao_id
     where k.devolvida_em is null and k.registrado_por is not null
       and k.devolver_ate is not null and k.devolver_ate < now() and k.devolver_ate > now() - interval '3 days'
  loop
    perform public.enfileirar_whatsapp(r.registrado_por, r.imobiliaria_id, 'chave_atrasada',
      'chave:' || r.id || ':' || r.devolver_ate,
      jsonb_build_array(public._primeiro_nome(r.registrado_por),
                        coalesce(r.codigo, 'sem código'),
                        coalesce(nullif(trim(r.com_quem), ''), 'alguém'),
                        to_char(r.devolver_ate at time zone 'America/Belem', 'DD/MM "às" HH24:MI')));
  end loop;
end $$;
revoke execute on function public.agendar_whatsapp() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Conversas no número da Frankkia (venda e suporte)
-- ---------------------------------------------------------------------
create table if not exists public.whatsapp_conversas (
  id          uuid primary key default gen_random_uuid(),
  telefone    text not null unique,                 -- como a Meta manda (wa_id)
  nome        text,                                 -- nome do perfil no WhatsApp
  ultima_em   timestamptz not null default now(),
  entrada_em  timestamptz,                          -- última mensagem da pessoa (janela de 24 h para responder)
  nao_lidas   int not null default 0,
  ia_pausada  boolean not null default false,
  criado_em   timestamptz not null default now()
);
create index if not exists whatsapp_conversas_ultima_idx on public.whatsapp_conversas (ultima_em desc);

create table if not exists public.whatsapp_mensagens (
  id          uuid primary key default gen_random_uuid(),
  conversa_id uuid not null references public.whatsapp_conversas(id) on delete cascade,
  direcao     text not null check (direcao in ('entrada', 'saida')),
  tipo        text not null default 'text',
  texto       text,
  wamid       text unique,
  situacao    text,                                 -- saída: sent / delivered / read / failed
  enviado_por uuid references auth.users(id) on delete set null,   -- saída escrita por alguém da Frankkia (nulo = IA)
  criado_em   timestamptz not null default now()
);
create index if not exists whatsapp_mensagens_conversa_idx on public.whatsapp_mensagens (conversa_id, criado_em);

alter table public.whatsapp_conversas enable row level security;
alter table public.whatsapp_mensagens enable row level security;
drop policy if exists whatsapp_conversas_frankkia on public.whatsapp_conversas;
create policy whatsapp_conversas_frankkia on public.whatsapp_conversas for select to authenticated using (public.is_frankkia());
drop policy if exists whatsapp_mensagens_frankkia on public.whatsapp_mensagens;
create policy whatsapp_mensagens_frankkia on public.whatsapp_mensagens for select to authenticated using (public.is_frankkia());

-- "PARAR": desliga os avisos dos perfis com esse número (compara DDD + 8 últimos dígitos; a Meta às vezes tira o 9)
create or replace function public.whatsapp_parar(p_wa_id text)
returns int language plpgsql security definer set search_path = public as $$
declare
  d text := regexp_replace(coalesce(p_wa_id, ''), '\D', '', 'g');
  v_n int;
begin
  if length(d) < 12 then return 0; end if;
  update public.perfis p set avisos_whatsapp = '{}'
   where cardinality(p.avisos_whatsapp) > 0
     and length(regexp_replace(coalesce(p.telefone, ''), '\D', '', 'g')) >= 10
     and right(regexp_replace(p.telefone, '\D', '', 'g'), 8) = right(d, 8)
     and left(right(public.whatsapp_e164(p.telefone), length(public.whatsapp_e164(p.telefone)) - 2), 2) = substr(d, 3, 2);
  get diagnostics v_n = row_count;
  return v_n;
end $$;
revoke execute on function public.whatsapp_parar(text) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Rotina a cada minuto: agenda lembretes e chama a função que envia a fila
-- ---------------------------------------------------------------------
select cron.unschedule('frankkia-whatsapp') where exists (select 1 from cron.job where jobname = 'frankkia-whatsapp');
select cron.schedule('frankkia-whatsapp', '* * * * *', $cron$
  select public.agendar_whatsapp();
  select net.http_post(
    url := 'https://yvbbktrufoyhtiotholf.supabase.co/functions/v1/enviar-whatsapp',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  ) where exists (select 1 from public.whatsapp_avisos
                   where enviado_em is null and tentativas < 5 and criado_em > now() - interval '6 hours');
$cron$);
