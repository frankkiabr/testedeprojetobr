-- =====================================================================
-- FRANKKIA — Endereços como base: lead "interessado em" e imóveis do proprietário
-- Lead: pode apontar para um imóvel captado (captação) OU para um endereço (+ unidade, quando é prédio).
-- Proprietário: lista de endereços que ele possui (além dos que já aparecem pelas captações).
-- As regras de quem vê o quê continuam as das próprias tabelas (leads e proprietarios).
-- =====================================================================
alter table public.leads add column if not exists interesse_captacao_id uuid references public.captacoes(id) on delete set null;
alter table public.leads add column if not exists interesse_imovel_id uuid references public.imoveis(id) on delete set null;
alter table public.leads add column if not exists interesse_unidade text check (char_length(interesse_unidade) <= 40);
create index if not exists leads_interesse_imovel_idx on public.leads (interesse_imovel_id) where interesse_imovel_id is not null;
create index if not exists leads_interesse_captacao_idx on public.leads (interesse_captacao_id) where interesse_captacao_id is not null;

-- [{ "imovel_id": "<uuid>", "unidade": "Apto 302" }, ...]
alter table public.proprietarios add column if not exists imoveis_ligados jsonb not null default '[]'::jsonb
  check (jsonb_typeof(imoveis_ligados) = 'array' and jsonb_array_length(imoveis_ligados) <= 50);
