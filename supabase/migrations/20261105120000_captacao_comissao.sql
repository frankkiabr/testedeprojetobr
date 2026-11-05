-- FRANKKIA — Comissão (%) combinada na captação: preenche os honorários ao registrar a venda/locação.
alter table public.captacoes add column if not exists comissao_pct numeric(5,2)
  check (comissao_pct is null or (comissao_pct > 0 and comissao_pct <= 100));
