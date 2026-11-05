-- =====================================================================
-- FRANKKIA — Propostas e contrapropostas no lead, controle de chaves e histórico de preço da captação
-- Quem vê o lead vê as propostas dele; quem vê a captação vê as chaves e o histórico de preço dela.
-- =====================================================================

-- 1) Propostas: cada linha é um passo da negociação (proposta do cliente, contraproposta do proprietário, aceita, recusada)
create table if not exists public.propostas (
  id             uuid primary key default gen_random_uuid(),
  imobiliaria_id uuid not null references public.imobiliarias(id) on delete cascade,
  lead_id        uuid not null references public.leads(id) on delete cascade,
  captacao_id    uuid references public.captacoes(id) on delete set null,
  tipo           text not null check (tipo in ('proposta', 'contraproposta', 'aceita', 'recusada')),
  valor          numeric(14,2) check (valor is null or valor > 0),
  condicoes      text check (char_length(condicoes) <= 2000),
  criado_por     uuid default auth.uid(),
  criado_em      timestamptz not null default now()
);
create index if not exists propostas_lead_idx on public.propostas (lead_id, criado_em);
create index if not exists propostas_captacao_idx on public.propostas (captacao_id) where captacao_id is not null;
alter table public.propostas enable row level security;
drop policy if exists propostas_ver on public.propostas;
create policy propostas_ver on public.propostas for select to authenticated
  using (public.is_member(imobiliaria_id) and exists (select 1 from public.leads l where l.id = lead_id));
drop policy if exists propostas_criar on public.propostas;
create policy propostas_criar on public.propostas for insert to authenticated
  with check (public.is_member(imobiliaria_id) and exists (select 1 from public.leads l where l.id = lead_id and l.imobiliaria_id = propostas.imobiliaria_id));
drop policy if exists propostas_excluir on public.propostas;
create policy propostas_excluir on public.propostas for delete to authenticated
  using (public.is_member(imobiliaria_id) and exists (select 1 from public.leads l where l.id = lead_id));

-- 2) Chaves: retirada e devolução das chaves de um imóvel captado
create table if not exists public.chaves (
  id                 uuid primary key default gen_random_uuid(),
  imobiliaria_id     uuid not null references public.imobiliarias(id) on delete cascade,
  captacao_id        uuid not null references public.captacoes(id) on delete cascade,
  com_quem           text not null check (char_length(com_quem) between 1 and 120),
  motivo             text check (char_length(motivo) <= 300),
  retirada_em        timestamptz not null default now(),
  devolver_ate       timestamptz,
  devolvida_em       timestamptz,
  registrado_por     uuid default auth.uid()
);
create index if not exists chaves_captacao_idx on public.chaves (captacao_id, retirada_em desc);
create index if not exists chaves_fora_idx on public.chaves (imobiliaria_id) where devolvida_em is null;
alter table public.chaves enable row level security;
drop policy if exists chaves_ver on public.chaves;
create policy chaves_ver on public.chaves for select to authenticated
  using (public.is_member(imobiliaria_id) and exists (select 1 from public.captacoes c where c.id = captacao_id));
drop policy if exists chaves_criar on public.chaves;
create policy chaves_criar on public.chaves for insert to authenticated
  with check (public.is_member(imobiliaria_id) and exists (select 1 from public.captacoes c where c.id = captacao_id and c.imobiliaria_id = chaves.imobiliaria_id));
drop policy if exists chaves_editar on public.chaves;
create policy chaves_editar on public.chaves for update to authenticated
  using (public.is_member(imobiliaria_id) and exists (select 1 from public.captacoes c where c.id = captacao_id))
  with check (public.is_member(imobiliaria_id));
drop policy if exists chaves_excluir on public.chaves;
create policy chaves_excluir on public.chaves for delete to authenticated
  using (public.is_admin(imobiliaria_id));

-- 3) Histórico de preço: gravado sozinho quando o valor da captação muda
create table if not exists public.captacao_precos (
  id           uuid primary key default gen_random_uuid(),
  captacao_id  uuid not null references public.captacoes(id) on delete cascade,
  valor_antes  numeric(14,2) not null,
  valor_depois numeric(14,2) not null,
  alterado_por uuid,
  alterado_em  timestamptz not null default now()
);
create index if not exists captacao_precos_idx on public.captacao_precos (captacao_id, alterado_em desc);
alter table public.captacao_precos enable row level security;
drop policy if exists captacao_precos_ver on public.captacao_precos;
create policy captacao_precos_ver on public.captacao_precos for select to authenticated
  using (exists (select 1 from public.captacoes c where c.id = captacao_id));

create or replace function public.registrar_preco_captacao()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.valor is distinct from old.valor then
    insert into public.captacao_precos (captacao_id, valor_antes, valor_depois, alterado_por)
    values (new.id, old.valor, new.valor, auth.uid());
  end if;
  return new;
end $$;
drop trigger if exists captacoes_historico_preco on public.captacoes;
create trigger captacoes_historico_preco after update of valor on public.captacoes
  for each row execute function public.registrar_preco_captacao();

-- Plano vencido: propostas e chaves também ficam só para consulta
drop trigger if exists propostas_plano_vencido on public.propostas;
create trigger propostas_plano_vencido before insert or update or delete on public.propostas
  for each row execute function public.bloquear_escrita_vencida();
drop trigger if exists chaves_plano_vencido on public.chaves;
create trigger chaves_plano_vencido before insert or update or delete on public.chaves
  for each row execute function public.bloquear_escrita_vencida();
