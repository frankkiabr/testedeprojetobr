-- =====================================================================
-- FRANKKIA — Teste grátis de 15 dias pelo site em TODOS os planos (Solo e Equipe 5/10/30/60).
-- Sai a trava que deixava Equipe 30/60 só por conversa no WhatsApp.
-- =====================================================================
drop trigger if exists imobiliarias_teste_planos on public.imobiliarias;
drop function if exists public.teste_so_planos_menores();

alter table public.config_cadastro alter column teste_dias set default 15;
update public.config_cadastro set teste_dias = 15;
