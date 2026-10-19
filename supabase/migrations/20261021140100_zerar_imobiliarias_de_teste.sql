-- =====================================================================
-- FRANKKIA — Zera as imobiliárias de teste (pedido do dono, 21/10/2026)
-- Apaga TODAS as imobiliárias e as contas que não são da equipe Frankkia.
-- A conta Frankkia, os planos e a estrutura do banco continuam.
-- =====================================================================
do $$
declare v_contas uuid[];
begin
  select coalesce(array_agg(u.id), '{}') into v_contas
  from auth.users u
  where not exists (select 1 from public.frankkia_admins f where f.usuario_id = u.id);

  delete from public.imobiliarias;   -- em cascata: equipe, convites, negócios, agenda, Academy, chamados, pedidos
  delete from public.acessos_demo;
  delete from public.interessados;
  delete from public.erros_sistema;
  delete from auth.users where id = any (v_contas);
end $$;
