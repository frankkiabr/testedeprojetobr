-- =====================================================================
-- FRANKKIA — Liberação automática do plano após pagamento confirmado pela Stripe
-- =====================================================================

-- Aplica o plano de um pedido pago (usada pela Frankkia e pelo aviso automático da Stripe)
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
         status = case when status in ('teste','pagamento','aguardando') then 'ativa' else status end,
         teste_ate = null
   where id = pu.imobiliaria_id;
  update public.pedidos_upgrade set liberado = true, liberado_em = now() where id = p_pedido;
end $$;

-- Ninguém do app chama direto: só o servidor (aviso da Stripe)
revoke execute on function public.aplicar_upgrade(uuid) from public, anon, authenticated;
grant execute on function public.aplicar_upgrade(uuid) to service_role;

-- "Liberar plano" no painel (pagamentos confirmados à mão): só a Frankkia
create or replace function public.liberar_upgrade(p_pedido uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_frankkia() then raise exception 'APENAS_FRANKKIA' using errcode = '42501'; end if;
  perform public.aplicar_upgrade(p_pedido);
end $$;
