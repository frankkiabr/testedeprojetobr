-- =====================================================================
-- FRANKKIA — Novos planos (Solo, Equipe 5/10/30/60), limite de anúncios e uso do Supabase
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Planos
--    limite = corretores além do administrador ("1 administrador + até N corretores").
--    Solo: o próprio corretor é o dono da conta; não convida ninguém (limite 0).
--    anuncios = imóveis publicados no portal (o CRM continua ilimitado).
-- ---------------------------------------------------------------------
alter table public.planos drop constraint if exists planos_limite_check;
alter table public.planos add constraint planos_limite_check check (limite >= 0);
alter table public.planos add column if not exists anuncios int not null default 0 check (anuncios >= 0);
alter table public.planos add column if not exists solo boolean not null default false;

alter table public.imobiliarias drop constraint if exists imobiliarias_limite_corretores_check;
alter table public.imobiliarias add constraint imobiliarias_limite_corretores_check check (limite_corretores >= 0);

insert into public.planos (nome, limite, preco, ordem, anuncios, solo) values
  ('Solo',       0,   99.00, 0,  15, true),
  ('Equipe 5',   5,  390.00, 1,  50, false),
  ('Equipe 10', 10,  650.00, 2, 100, false),
  ('Equipe 30', 30, 1800.00, 3, 300, false),
  ('Equipe 60', 60, 3300.00, 4, 600, false)
on conflict (nome) do update set limite = excluded.limite, preco = excluded.preco, ordem = excluded.ordem,
  anuncios = excluded.anuncios, solo = excluded.solo;

-- Plano antigo (não há clientes nele)
delete from public.planos where nome = 'Equipe 15'
  and not exists (select 1 from public.imobiliarias where plano = 'Equipe 15')
  and not exists (select 1 from public.pedidos_upgrade where plano_atual = 'Equipe 15' or plano_novo = 'Equipe 15');

alter table public.imobiliarias alter column plano set default 'Equipe 10';
alter table public.imobiliarias alter column limite_corretores set default 10;

-- ---------------------------------------------------------------------
-- 2. Uso do Supabase (painel Frankkia): tamanho do banco, arquivos e contas
--    Limites do plano gratuito: 500 MB de banco, 1 GB de arquivos, 50 mil usuários ativos/mês.
-- ---------------------------------------------------------------------
create or replace function public.uso_supabase()
returns table (banco_bytes bigint, arquivos_bytes bigint, arquivos_qtd bigint, contas bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_frankkia() then raise exception 'APENAS_FRANKKIA' using errcode = '42501'; end if;
  return query
  select pg_database_size(current_database()),
         coalesce((select sum(coalesce((o.metadata ->> 'size')::bigint, 0)) from storage.objects o), 0)::bigint,
         (select count(*) from storage.objects),
         (select count(*) from auth.users);
end $$;
revoke execute on function public.uso_supabase() from public, anon;
grant execute on function public.uso_supabase() to authenticated;
