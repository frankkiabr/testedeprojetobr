-- =====================================================================
-- FRANKKIA — Quem criou a conta pelo site e pagou um plano vira "Virou cliente" em Interessados sozinho.
-- (A ligação entre o interessado e a imobiliária é o e-mail guardado em testes_gratis.)
-- =====================================================================
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

  -- Conta criada pelo site que pagou: o interessado vira cliente
  update public.interessados set status = 'cliente', atualizado_em = now()
   where origem = 'cadastro' and status <> 'cliente'
     and lower(email) in (select lower(t.email) from public.testes_gratis t where t.imobiliaria_id = pu.imobiliaria_id);
end $$;
revoke execute on function public.aplicar_upgrade(uuid) from public, anon, authenticated;
grant execute on function public.aplicar_upgrade(uuid) to service_role;
