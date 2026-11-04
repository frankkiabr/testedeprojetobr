-- =====================================================================
-- FRANKKIA — Plano vencido: modo só leitura por 90 dias, avisos por e-mail e prazo de exclusão
-- Linha do tempo:
--   7 dias antes de vencer (teste grátis ou assinatura cancelada) → e-mail + faixa no painel
--   venceu → modo só leitura: a equipe entra e vê tudo, mas não cadastra, não edita, não exclui
--            (gatilho bloqueia qualquer gravação); anúncios saem do portal (imob_liberada continua falso)
--   83º dia → e-mail "seus dados serão excluídos em 7 dias"
--   90º dia → a conta aparece no Painel Frankkia como "Prazo encerrado" para a Frankkia excluir
-- Exportar dados: não existe no app; a cópia é pedida por e-mail (Termos de Uso).
-- =====================================================================

-- 1) Desde quando a conta está suspensa (o teste usa teste_ate)
alter table public.imobiliarias add column if not exists suspensa_em timestamptz;
update public.imobiliarias set suspensa_em = now() where status = 'suspensa' and suspensa_em is null;

create or replace function public.marcar_suspensa_em()
returns trigger language plpgsql as $$
begin
  if new.status = 'suspensa' and (tg_op = 'INSERT' or old.status is distinct from 'suspensa') then
    new.suspensa_em := now();
  elsif new.status <> 'suspensa' then
    new.suspensa_em := null;
  end if;
  return new;
end $$;
drop trigger if exists imobiliarias_suspensa_em on public.imobiliarias;
create trigger imobiliarias_suspensa_em before insert or update of status on public.imobiliarias
  for each row execute function public.marcar_suspensa_em();

-- Quando venceu (null = em dia)
create or replace function public.vencida_desde(p_status text, p_teste_ate timestamptz, p_suspensa_em timestamptz)
returns timestamptz language sql stable as $$
  select case
    when p_status = 'teste' and p_teste_ate is not null and p_teste_ate < now() then p_teste_ate
    when p_status = 'suspensa' then coalesce(p_suspensa_em, now())
    else null end;
$$;

-- Dá para ver os dados: em dia, ou vencida há menos de 90 dias (modo só leitura)
create or replace function public.imob_legivel(p_status text, p_teste_ate timestamptz, p_suspensa_em timestamptz)
returns boolean language sql stable as $$
  select coalesce(public.vencida_desde(p_status, p_teste_ate, p_suspensa_em) > now() - interval '90 days', true);
$$;

-- 2) Membro e administrador continuam vendo os dados no modo só leitura
create or replace function public.is_member(p_imob uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.membros m join public.imobiliarias i on i.id = m.imobiliaria_id
    where m.imobiliaria_id = p_imob and m.usuario_id = auth.uid() and m.ativo
      and public.imob_legivel(i.status, i.teste_ate, i.suspensa_em));
$$;

create or replace function public.is_admin(p_imob uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.membros m join public.imobiliarias i on i.id = m.imobiliaria_id
    where m.imobiliaria_id = p_imob and m.usuario_id = auth.uid() and m.ativo and m.papel = 'admin'
      and public.imob_legivel(i.status, i.teste_ate, i.suspensa_em));
$$;

-- 3) Gravações bloqueadas enquanto o plano estiver vencido.
-- Vale só para quem está logado (rotinas do sistema, webhook da Stripe e a Frankkia passam).
-- Argumento opcional: coluna que aponta para a avaliação (tabelas filhas do estudo de mercado).
create or replace function public.bloquear_escrita_vencida()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_linha jsonb := to_jsonb(coalesce(new, old));
  v_imob uuid;
begin
  if auth.uid() is null or public.is_frankkia()
     or coalesce(current_setting('frankkia.operacao_sistema', true), '') = 'on' then
    return coalesce(new, old);
  end if;
  if tg_nargs > 0 then
    select a.imobiliaria_id into v_imob from public.avaliacoes a where a.id = (v_linha ->> tg_argv[0])::uuid;
  else
    v_imob := (v_linha ->> 'imobiliaria_id')::uuid;
  end if;
  if v_imob is not null and exists (select 1 from public.imobiliarias i
                                     where i.id = v_imob and not public.imob_liberada(i.status, i.teste_ate)) then
    raise exception 'PLANO_VENCIDO: o plano venceu; renove para voltar a cadastrar e editar' using errcode = 'P0001';
  end if;
  return coalesce(new, old);
end $$;

do $$
declare t text;
begin
  foreach t in array array['anuncio_fotos','anuncios','aulas','avaliacoes','captacoes','compromissos','convites','documentos',
                           'fechamentos_informados','feeds_portais','imoveis','leads','marca_logo','membros','parceiros',
                           'progresso_aulas','proprietarios','transacao_detalhes','transacao_participantes','transacoes',
                           'trilhas','vendas_externas'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_plano_vencido', t);
    execute format('create trigger %I before insert or update or delete on public.%I
                    for each row execute function public.bloquear_escrita_vencida()', t || '_plano_vencido', t);
  end loop;
  foreach t in array array['avaliacao_amostras','avaliacao_notas'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_plano_vencido', t);
    execute format('create trigger %I before insert or update or delete on public.%I
                    for each row execute function public.bloquear_escrita_vencida(%L)', t || '_plano_vencido', t, 'avaliacao_id');
  end loop;
end $$;

-- 4) Novos e-mails: plano vencendo (assinatura cancelada), plano vencido e exclusão próxima
alter table public.avisos_email drop constraint if exists avisos_email_tipo_check;
alter table public.avisos_email add constraint avisos_email_tipo_check check (tipo in (
  'boas_vindas', 'teste_acabando', 'teste_terminou', 'pagamento_confirmado', 'renovacao_recusada',
  'assinatura_cancelada', 'plano_vencendo', 'plano_vencido', 'exclusao_proxima'));

-- Conferido a cada 5 minutos (substitui a versão que só olhava o teste grátis)
create or replace function public.agendar_avisos_teste()
returns void language plpgsql security definer set search_path = public as $$
declare i record;
begin
  -- Teste grátis acabando: 7 dias antes
  for i in select id, teste_ate from public.imobiliarias
            where status = 'teste' and teste_ate is not null
              and teste_ate > now() and teste_ate <= now() + interval '7 days' loop
    perform public.enfileirar_aviso(i.id, 'teste_acabando', 'teste_acabando:' || i.id || ':' || i.teste_ate::date,
      jsonb_build_object('teste_ate', i.teste_ate));
  end loop;
  -- Teste grátis terminou
  for i in select id, teste_ate from public.imobiliarias
            where status = 'teste' and teste_ate is not null
              and teste_ate <= now() and teste_ate > now() - interval '3 days' loop
    perform public.enfileirar_aviso(i.id, 'teste_terminou', 'teste_terminou:' || i.id || ':' || i.teste_ate::date,
      jsonb_build_object('teste_ate', i.teste_ate, 'excluir_em', i.teste_ate + interval '90 days'));
  end loop;
  -- Assinatura cancelada que vai terminar: 7 dias antes
  for i in select s.imobiliaria_id as id, s.cancela_em from public.assinaturas_stripe s
            join public.imobiliarias im on im.id = s.imobiliaria_id
            where s.situacao = 'cancelamento_agendado' and s.cancela_em is not null and im.status = 'ativa'
              and s.cancela_em > now() and s.cancela_em <= now() + interval '7 days' loop
    perform public.enfileirar_aviso(i.id, 'plano_vencendo', 'plano_vencendo:' || i.id || ':' || i.cancela_em::date,
      jsonb_build_object('vence_em', i.cancela_em));
  end loop;
  -- Plano vencido (conta suspensa)
  for i in select id, suspensa_em from public.imobiliarias
            where status = 'suspensa' and suspensa_em is not null and suspensa_em > now() - interval '3 days' loop
    perform public.enfileirar_aviso(i.id, 'plano_vencido', 'plano_vencido:' || i.id || ':' || i.suspensa_em::date,
      jsonb_build_object('excluir_em', i.suspensa_em + interval '90 days'));
  end loop;
  -- Exclusão em 7 dias (83º ao 90º dia depois de vencer)
  for i in select id, public.vencida_desde(status, teste_ate, suspensa_em) as desde from public.imobiliarias
            where public.vencida_desde(status, teste_ate, suspensa_em) between now() - interval '90 days' and now() - interval '83 days' loop
    perform public.enfileirar_aviso(i.id, 'exclusao_proxima', 'exclusao_proxima:' || i.id || ':' || i.desde::date,
      jsonb_build_object('excluir_em', i.desde + interval '90 days'));
  end loop;
end $$;
revoke execute on function public.agendar_avisos_teste() from public, anon, authenticated;

-- 5) Painel Frankkia: data em que o prazo de 90 dias acaba (para excluir a conta)
drop function if exists public.painel_imobiliarias();
create function public.painel_imobiliarias()
returns table (
  id uuid, nome text, cidade text, cnpj text, plano text, status text, cliente_desde timestamptz,
  teste_ate timestamptz, teste_dias int, ultimo_acesso timestamptz, admin_nome text, admin_email text,
  vagas int, uso_negocios int, uso_performance int, uso_academy int, uso_marketing int, admin_foto text,
  excluir_em timestamptz)
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
       and true = any (c.checklist_marketing))::int,
    (select p.foto_url from public.membros m join public.perfis p on p.id = m.usuario_id
      where m.imobiliaria_id = i.id and m.papel = 'admin' and m.ativo order by m.criado_em limit 1),
    public.vencida_desde(i.status, i.teste_ate, i.suspensa_em) + interval '90 days'
  from public.imobiliarias i
  order by i.nome;
end $$;
revoke execute on function public.painel_imobiliarias() from public, anon;
grant execute on function public.painel_imobiliarias() to authenticated;
