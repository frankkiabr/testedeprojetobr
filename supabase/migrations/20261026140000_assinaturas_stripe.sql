-- =====================================================================
-- FRANKKIA — Assinatura da Stripe de cada imobiliária
-- Guardada no primeiro pagamento; upgrades e reduções passam a atualizar essa mesma assinatura
-- (sem criar uma segunda cobrança e sem ajuste manual no painel da Stripe).
-- Só as funções do servidor leem e gravam (nenhuma regra de acesso para o app).
-- =====================================================================
create table if not exists public.assinaturas_stripe (
  imobiliaria_id uuid primary key references public.imobiliarias(id) on delete cascade,
  cliente        text not null,                 -- cus_...
  assinatura     text not null,                 -- sub_...
  ciclo          text not null default 'mensal' check (ciclo in ('mensal', 'anual')),
  atualizado_em  timestamptz not null default now()
);
alter table public.assinaturas_stripe enable row level security;
revoke all on public.assinaturas_stripe from anon, authenticated;

-- Para a tela de pagamento saber se é a primeira assinatura ou uma troca (sem expor os códigos da Stripe)
create or replace function public.tem_assinatura(p_imob uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select (public.is_admin_conta(p_imob) or public.is_frankkia())
     and exists (select 1 from public.assinaturas_stripe where imobiliaria_id = p_imob);
$$;
revoke execute on function public.tem_assinatura(uuid) from public, anon;
grant execute on function public.tem_assinatura(uuid) to authenticated;
