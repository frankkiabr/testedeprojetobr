-- =====================================================================
-- FRANKKIA — E-mails automáticos para o administrador da conta
-- Uma fila (avisos_email) é preenchida por gatilhos nos momentos certos; a cada 5 minutos o banco chama
-- a função enviar-avisos, que manda os pendentes pelo Resend com o layout da Frankkia.
--   boas_vindas            conta criada pelo site (testes_gratis)
--   teste_acabando         2 dias antes do fim do teste grátis
--   teste_terminou         quando o teste grátis termina
--   pagamento_confirmado   plano liberado depois do pagamento
--   renovacao_recusada     cartão recusou a renovação
--   assinatura_cancelada   administrador cancelou a assinatura pelo app
-- Cada aviso tem uma chave única: o mesmo e-mail nunca sai duas vezes.
-- =====================================================================
create table if not exists public.avisos_email (
  id             uuid primary key default gen_random_uuid(),
  imobiliaria_id uuid references public.imobiliarias(id) on delete cascade,
  tipo           text not null check (tipo in ('boas_vindas', 'teste_acabando', 'teste_terminou',
                                               'pagamento_confirmado', 'renovacao_recusada', 'assinatura_cancelada')),
  chave          text not null unique,
  para           text not null,
  dados          jsonb not null default '{}'::jsonb,
  tentativas     int not null default 0,
  erro           text,
  enviado_em     timestamptz,
  criado_em      timestamptz not null default now()
);
create index if not exists avisos_email_pendentes_idx on public.avisos_email (criado_em) where enviado_em is null;
alter table public.avisos_email enable row level security;
drop policy if exists avisos_email_frankkia on public.avisos_email;
create policy avisos_email_frankkia on public.avisos_email for select to authenticated using (public.is_frankkia());

-- Coloca um aviso na fila para o administrador da imobiliária (nada acontece se a chave já existe)
create or replace function public.enfileirar_aviso(p_imob uuid, p_tipo text, p_chave text, p_dados jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_para text;
  v_nome text;
  v_imob text;
begin
  select pf.email, split_part(trim(pf.nome), ' ', 1) into v_para, v_nome
    from public.membros m join public.perfis pf on pf.id = m.usuario_id
   where m.imobiliaria_id = p_imob and m.papel = 'admin' and m.ativo
   order by m.criado_em limit 1;
  if coalesce(v_para, '') = '' then return; end if;
  select nome into v_imob from public.imobiliarias where id = p_imob;
  insert into public.avisos_email (imobiliaria_id, tipo, chave, para, dados)
  values (p_imob, p_tipo, p_chave, lower(v_para),
          jsonb_build_object('nome', v_nome, 'imobiliaria', v_imob) || coalesce(p_dados, '{}'::jsonb))
  on conflict (chave) do nothing;
end $$;
revoke execute on function public.enfileirar_aviso(uuid, text, text, jsonb) from public, anon, authenticated;

-- Boas-vindas: conta criada pelo site
create or replace function public.aviso_boas_vindas()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.imobiliaria_id is not null then
    perform public.enfileirar_aviso(new.imobiliaria_id, 'boas_vindas', 'boas_vindas:' || new.imobiliaria_id,
      jsonb_build_object('teste_ate', (select teste_ate from public.imobiliarias where id = new.imobiliaria_id)));
  end if;
  return new;
end $$;
drop trigger if exists testes_gratis_boas_vindas on public.testes_gratis;
create trigger testes_gratis_boas_vindas after insert on public.testes_gratis
  for each row execute function public.aviso_boas_vindas();

-- Pagamento confirmado: o pedido de plano foi liberado
create or replace function public.aviso_pagamento()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.liberado and not old.liberado and new.tipo = 'upgrade' then
    perform public.enfileirar_aviso(new.imobiliaria_id, 'pagamento_confirmado', 'pagamento:' || new.id,
      jsonb_build_object('plano', new.plano_novo, 'limite', (select limite from public.planos where nome = new.plano_novo),
                         'ciclo', new.ciclo));
  end if;
  return new;
end $$;
drop trigger if exists pedidos_upgrade_aviso on public.pedidos_upgrade;
create trigger pedidos_upgrade_aviso after update of liberado on public.pedidos_upgrade
  for each row execute function public.aviso_pagamento();

-- Renovação recusada e cancelamento: quando a situação da assinatura muda
create or replace function public.aviso_assinatura()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.situacao is distinct from old.situacao then
    if new.situacao = 'pagamento_recusado' then
      perform public.enfileirar_aviso(new.imobiliaria_id, 'renovacao_recusada',
        'recusada:' || new.assinatura || ':' || coalesce(new.proxima_cobranca::date::text, now()::date::text), '{}'::jsonb);
    elsif new.situacao = 'cancelamento_agendado' then
      perform public.enfileirar_aviso(new.imobiliaria_id, 'assinatura_cancelada',
        'cancelada:' || new.assinatura || ':' || coalesce(new.cancela_em::text, now()::text),
        jsonb_build_object('cancela_em', new.cancela_em));
    end if;
  end if;
  return new;
end $$;
drop trigger if exists assinaturas_stripe_aviso on public.assinaturas_stripe;
create trigger assinaturas_stripe_aviso after update of situacao on public.assinaturas_stripe
  for each row execute function public.aviso_assinatura();

-- Teste grátis acabando (2 dias antes) e terminado: conferido a cada execução da rotina
create or replace function public.agendar_avisos_teste()
returns void language plpgsql security definer set search_path = public as $$
declare i record;
begin
  for i in select id, teste_ate from public.imobiliarias
            where status = 'teste' and teste_ate is not null
              and teste_ate > now() and teste_ate <= now() + interval '2 days' loop
    perform public.enfileirar_aviso(i.id, 'teste_acabando', 'teste_acabando:' || i.id || ':' || i.teste_ate::date,
      jsonb_build_object('teste_ate', i.teste_ate));
  end loop;
  for i in select id, teste_ate from public.imobiliarias
            where status = 'teste' and teste_ate is not null
              and teste_ate <= now() and teste_ate > now() - interval '3 days' loop
    perform public.enfileirar_aviso(i.id, 'teste_terminou', 'teste_terminou:' || i.id || ':' || i.teste_ate::date,
      jsonb_build_object('teste_ate', i.teste_ate));
  end loop;
end $$;
revoke execute on function public.agendar_avisos_teste() from public, anon, authenticated;

-- Rotina a cada 5 minutos: confere os testes e chama a função que envia a fila
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

select cron.unschedule('frankkia-avisos-email') where exists (select 1 from cron.job where jobname = 'frankkia-avisos-email');
select cron.schedule('frankkia-avisos-email', '*/5 * * * *', $cron$
  select public.agendar_avisos_teste();
  select net.http_post(
    url := 'https://yvbbktrufoyhtiotholf.supabase.co/functions/v1/enviar-avisos',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  ) where exists (select 1 from public.avisos_email where enviado_em is null and tentativas < 5);
$cron$);
