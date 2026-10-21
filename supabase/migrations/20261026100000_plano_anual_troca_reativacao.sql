-- =====================================================================
-- FRANKKIA — Plano anual, troca para um plano menor e reativação de corretores pela Frankkia
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Pedidos de plano: ciclo (mensal/anual) e tipo (upgrade/redução)
--    Anual = 12 meses pelo preço de 10 (cobrado uma vez por ano).
-- ---------------------------------------------------------------------
alter table public.pedidos_upgrade add column if not exists ciclo text not null default 'mensal';
alter table public.pedidos_upgrade add column if not exists tipo text not null default 'upgrade';
alter table public.pedidos_upgrade drop constraint if exists pedidos_upgrade_ciclo_check;
alter table public.pedidos_upgrade add constraint pedidos_upgrade_ciclo_check check (ciclo in ('mensal', 'anual'));
alter table public.pedidos_upgrade drop constraint if exists pedidos_upgrade_tipo_check;
alter table public.pedidos_upgrade add constraint pedidos_upgrade_tipo_check check (tipo in ('upgrade', 'reducao'));

-- O valor sempre vem da tabela de planos (o app não escolhe o preço)
create or replace function public.preco_do_pedido()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  select preco into new.valor_mensal from public.planos where nome = new.plano_novo;
  return new;
end $$;
drop trigger if exists pedidos_upgrade_preco on public.pedidos_upgrade;
create trigger pedidos_upgrade_preco before insert on public.pedidos_upgrade
  for each row execute function public.preco_do_pedido();
revoke execute on function public.preco_do_pedido() from public, anon, authenticated;

-- Pelo app o administrador só cria pedidos de upgrade; a redução passa por solicitar_reducao
drop policy if exists upgrades_insercao on public.pedidos_upgrade;
create policy upgrades_insercao on public.pedidos_upgrade for insert to authenticated
  with check (public.is_admin_conta(imobiliaria_id) and pagamento = 'aguardando' and not liberado
              and criado_por = auth.uid() and tipo = 'upgrade');

-- ---------------------------------------------------------------------
-- 2. Troca para um plano menor: o administrador pede pelo app; a Frankkia aplica.
--    Só é possível se os corretores ativos + convites pendentes cabem no plano novo.
--    Corretores desativados continuam com todo o histórico (vendas, ranking, captações).
-- ---------------------------------------------------------------------
create or replace function public.solicitar_reducao(p_plano text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  im       public.imobiliarias%rowtype;
  v_limite int;
  v_uso    int;
  v_id     uuid;
begin
  select i.* into im from public.imobiliarias i
   join public.membros m on m.imobiliaria_id = i.id
   where m.usuario_id = auth.uid() and m.ativo and m.papel = 'admin'
   order by m.criado_em limit 1;
  if not found then raise exception 'APENAS_ADMIN' using errcode = '42501'; end if;
  select limite into v_limite from public.planos where nome = p_plano and not solo;
  if not found then raise exception 'PLANO_INVALIDO' using errcode = 'P0001'; end if;
  if v_limite >= im.limite_corretores then raise exception 'NAO_E_REDUCAO' using errcode = 'P0001'; end if;
  v_uso := public.vagas_em_uso(im.id);
  if v_uso > v_limite then
    raise exception 'VAGAS_EM_USO: % corretores ativos ou convidados; o plano % tem % vagas', v_uso, p_plano, v_limite using errcode = 'P0001';
  end if;
  if exists (select 1 from public.pedidos_upgrade where imobiliaria_id = im.id and not liberado and pagamento in ('aguardando', 'pendente', 'confirmado')) then
    raise exception 'PEDIDO_ABERTO' using errcode = 'P0001';
  end if;
  insert into public.pedidos_upgrade (imobiliaria_id, plano_atual, plano_novo, valor_mensal, tipo, criado_por)
  values (im.id, im.plano, p_plano, 0, 'reducao', auth.uid())
  returning id into v_id;
  return v_id;
end $$;
revoke execute on function public.solicitar_reducao(text) from public, anon;
grant execute on function public.solicitar_reducao(text) to authenticated;

-- A Frankkia aplica a redução (confere as vagas de novo, porque a equipe pode ter mudado)
create or replace function public.aplicar_reducao(p_pedido uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  pu       public.pedidos_upgrade%rowtype;
  v_limite int;
  v_uso    int;
begin
  if not public.is_frankkia() then raise exception 'APENAS_FRANKKIA' using errcode = '42501'; end if;
  select * into pu from public.pedidos_upgrade where id = p_pedido for update;
  if not found or pu.tipo <> 'reducao' or pu.liberado or pu.pagamento = 'cancelado' then
    raise exception 'PEDIDO_NAO_LIBERAVEL' using errcode = 'P0001';
  end if;
  select limite into v_limite from public.planos where nome = pu.plano_novo;
  v_uso := public.vagas_em_uso(pu.imobiliaria_id);
  if v_uso > v_limite then
    raise exception 'VAGAS_EM_USO: % corretores ativos ou convidados; o plano % tem % vagas', v_uso, pu.plano_novo, v_limite using errcode = 'P0001';
  end if;
  update public.imobiliarias set plano = pu.plano_novo, limite_corretores = v_limite where id = pu.imobiliaria_id;
  update public.pedidos_upgrade set liberado = true, liberado_em = now(), pagamento = 'confirmado' where id = p_pedido;
end $$;
revoke execute on function public.aplicar_reducao(uuid) from public, anon;
grant execute on function public.aplicar_reducao(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 3. Reativação de corretor: o administrador desativa quando quiser; reativar só pela Frankkia
--    (evita revezar corretores numa mesma vaga). O pedido chega como chamado.
-- ---------------------------------------------------------------------
create or replace function public.proteger_reativacao()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.papel = 'corretor' and new.ativo and not old.ativo
     and not public.is_frankkia()
     and coalesce(current_setting('frankkia.operacao_sistema', true), 'off') <> 'on' then
    raise exception 'REATIVACAO_PELA_FRANKKIA: peça a reativação à equipe Frankkia' using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists membros_reativacao on public.membros;
create trigger membros_reativacao before update of ativo on public.membros
  for each row execute function public.proteger_reativacao();
revoke execute on function public.proteger_reativacao() from public, anon, authenticated;

-- Convidar de novo um corretor desativado também não vale (seria uma reativação por fora)
create or replace function public.bloquear_convite_desativado()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.membros m join auth.users u on u.id = m.usuario_id
              where m.imobiliaria_id = new.imobiliaria_id and not m.ativo and lower(u.email) = lower(new.email)) then
    raise exception 'MEMBRO_DESATIVADO: este corretor está desativado; peça a reativação à equipe Frankkia' using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists convites_desativado on public.convites;
create trigger convites_desativado before insert on public.convites
  for each row execute function public.bloquear_convite_desativado();
revoke execute on function public.bloquear_convite_desativado() from public, anon, authenticated;

-- Administrador pede a reativação (vira um chamado para a Frankkia)
create or replace function public.pedir_reativacao(p_usuario uuid, p_motivo text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  m      public.membros%rowtype;
  v_nome text;
  v_id   uuid;
begin
  select * into m from public.membros where usuario_id = p_usuario and papel = 'corretor' and not ativo
    and public.is_admin(imobiliaria_id) limit 1;
  if not found then raise exception 'APENAS_ADMIN' using errcode = '42501'; end if;
  select coalesce(nullif(nome, ''), email) into v_nome from public.perfis where id = p_usuario;
  insert into public.chamados (imobiliaria_id, autor_id, assunto, categoria, mensagem)
  values (m.imobiliaria_id, auth.uid(), left('Reativar corretor: ' || v_nome, 120), 'Reativação',
          left(coalesce(nullif(trim(p_motivo), ''), 'Pedido de reativação de acesso.'), 2000) || E'\n\n[corretor:' || p_usuario || ']')
  returning id into v_id;
  return v_id;
end $$;
revoke execute on function public.pedir_reativacao(uuid, text) from public, anon;
grant execute on function public.pedir_reativacao(uuid, text) to authenticated;

-- A Frankkia reativa (a regra de vagas do plano continua valendo)
create or replace function public.reativar_corretor(p_imob uuid, p_usuario uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_frankkia() then raise exception 'APENAS_FRANKKIA' using errcode = '42501'; end if;
  update public.membros set ativo = true where imobiliaria_id = p_imob and usuario_id = p_usuario and papel = 'corretor';
end $$;
revoke execute on function public.reativar_corretor(uuid, uuid) from public, anon;
grant execute on function public.reativar_corretor(uuid, uuid) to authenticated;

-- Painel Frankkia: corretores de todas as imobiliárias (só dados de conta: nome, e-mail, situação)
create or replace function public.painel_corretores()
returns table (usuario_id uuid, nome text, email text, imobiliaria_id uuid, imobiliaria text, plano text,
               papel text, ativo boolean, desde timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_frankkia() then raise exception 'APENAS_FRANKKIA' using errcode = '42501'; end if;
  return query
    select m.usuario_id, coalesce(nullif(p.nome, ''), p.email), p.email, i.id, i.nome, i.plano, m.papel, m.ativo, m.criado_em
      from public.membros m
      join public.imobiliarias i on i.id = m.imobiliaria_id
      join public.perfis p on p.id = m.usuario_id
     order by i.nome, m.papel, p.nome;
end $$;
revoke execute on function public.painel_corretores() from public, anon;
grant execute on function public.painel_corretores() to authenticated;
