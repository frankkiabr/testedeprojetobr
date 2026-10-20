-- =====================================================================
-- FRANKKIA — Código único de cada imóvel captado (ex.: FK-7Q3M2X)
-- Único em todo o sistema (todas as imobiliárias e corretores), para busca interna e no portal.
-- Letras e números sem os que confundem (sem 0/O, 1/I/L): 31^6 ≈ 887 milhões de combinações.
-- =====================================================================
create or replace function public.gerar_codigo_imovel()
returns text language plpgsql volatile set search_path = public as $$
declare
  alfabeto constant text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  v text;
begin
  loop
    v := 'FK-' || (select string_agg(substr(alfabeto, 1 + floor(random() * length(alfabeto))::int, 1), '') from generate_series(1, 6));
    exit when not exists (select 1 from public.captacoes where codigo = v);
  end loop;
  return v;
end $$;

alter table public.captacoes add column if not exists codigo text;
update public.captacoes set codigo = public.gerar_codigo_imovel() where codigo is null;
alter table public.captacoes alter column codigo set default public.gerar_codigo_imovel();
alter table public.captacoes alter column codigo set not null;
alter table public.captacoes add constraint captacoes_codigo_formato check (codigo ~ '^FK-[2-9A-HJKMNP-Z]{6}$');
create unique index if not exists captacoes_codigo_unico on public.captacoes (codigo);

-- O código não muda depois de criado
create or replace function public.proteger_codigo()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.codigo is distinct from old.codigo then
    raise exception 'CODIGO_FIXO: o código do imóvel não pode ser alterado' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger captacoes_codigo_fixo before update of codigo on public.captacoes
  for each row execute function public.proteger_codigo();

revoke execute on function public.proteger_codigo() from public, anon, authenticated;
