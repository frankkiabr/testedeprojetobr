-- =====================================================================
-- FRANKKIA — Ciclo de vida da assinatura na Stripe
-- - Renovação recusada: a imobiliária fica "pagamento" (continua usando enquanto a Stripe tenta de novo)
--   e o administrador vê o aviso para atualizar o cartão.
-- - Cancelamento pelo app: vale no fim do período já pago (cancelamento agendado, pode ser desfeito).
-- - Assinatura encerrada (cancelada ou sem pagamento depois das tentativas): a imobiliária é suspensa
--   e o administrador pode contratar de novo; os dados continuam guardados.
-- =====================================================================
alter table public.assinaturas_stripe add column if not exists situacao text not null default 'ativa'
  check (situacao in ('ativa', 'pagamento_recusado', 'cancelamento_agendado', 'encerrada'));
alter table public.assinaturas_stripe add column if not exists proxima_cobranca timestamptz;
alter table public.assinaturas_stripe add column if not exists cancela_em timestamptz;

-- Chamada só pelas funções do servidor (webhook da Stripe e botão de cancelar).
-- Só vale para a assinatura atual da imobiliária: avisos de uma assinatura antiga (já trocada) são ignorados.
create or replace function public.registrar_assinatura(
  p_assinatura text, p_situacao text, p_proxima timestamptz, p_cancela timestamptz)
returns void language plpgsql security definer set search_path = public as $$
declare v_imob uuid;
begin
  update public.assinaturas_stripe
     set situacao = p_situacao, proxima_cobranca = p_proxima, cancela_em = p_cancela, atualizado_em = now()
   where assinatura = p_assinatura
  returning imobiliaria_id into v_imob;
  if v_imob is null then return; end if;

  perform set_config('frankkia.operacao_sistema', 'on', true);
  update public.imobiliarias set status = case
      when p_situacao = 'pagamento_recusado' and status = 'ativa' then 'pagamento'
      when p_situacao in ('ativa', 'cancelamento_agendado') and status = 'pagamento' then 'ativa'
      when p_situacao = 'encerrada' and status in ('ativa', 'pagamento') then 'suspensa'
      else status end
   where id = v_imob;
  perform set_config('frankkia.operacao_sistema', 'off', true);
end $$;
revoke execute on function public.registrar_assinatura(text, text, timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.registrar_assinatura(text, text, timestamptz, timestamptz) to service_role;

-- Para a tela do plano e os avisos do administrador (sem expor os códigos da Stripe)
create or replace function public.minha_assinatura(p_imob uuid)
returns table (situacao text, ciclo text, proxima_cobranca timestamptz, cancela_em timestamptz)
language sql stable security definer set search_path = public as $$
  select a.situacao, a.ciclo, a.proxima_cobranca, a.cancela_em
    from public.assinaturas_stripe a
   where a.imobiliaria_id = p_imob and (public.is_admin_conta(p_imob) or public.is_frankkia());
$$;
revoke execute on function public.minha_assinatura(uuid) from public, anon;
grant execute on function public.minha_assinatura(uuid) to authenticated;

-- Contratar de novo depois de a assinatura ser encerrada reativa a conta
-- (uma suspensão feita à mão pela Frankkia continua valendo).
create or replace function public.aplicar_upgrade(p_pedido uuid)
returns void language plpgsql security definer set search_path = public as $$
declare pu public.pedidos_upgrade%rowtype;
begin
  select * into pu from public.pedidos_upgrade where id = p_pedido for update;
  if not found then raise exception 'PEDIDO_NAO_ENCONTRADO' using errcode = 'P0002'; end if;
  if pu.pagamento <> 'confirmado' or pu.liberado then raise exception 'PEDIDO_NAO_LIBERAVEL' using errcode = 'P0001'; end if;
  update public.imobiliarias
     set plano = pu.plano_novo,
         limite_corretores = (select limite from public.planos where nome = pu.plano_novo),
         status = case
           when status in ('teste','pagamento','aguardando') then 'ativa'
           when status = 'suspensa' and exists (select 1 from public.assinaturas_stripe s
                                                 where s.imobiliaria_id = pu.imobiliaria_id and s.situacao = 'encerrada') then 'ativa'
           else status end,
         teste_ate = null
   where id = pu.imobiliaria_id;
  update public.pedidos_upgrade set liberado = true, liberado_em = now() where id = p_pedido;
end $$;
revoke execute on function public.aplicar_upgrade(uuid) from public, anon, authenticated;
grant execute on function public.aplicar_upgrade(uuid) to service_role;
