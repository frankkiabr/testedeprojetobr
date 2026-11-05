-- =====================================================================
-- FRANKKIA — Clientes (leads e proprietários): código, tipo do cliente e dados para contrato
-- codigo: CL-XXXXXX (gerado pelo banco se o app não mandar), para busca e contratos.
-- tipos: papéis do cliente (comprador, locatario, proprietario, investidor, fiador), mais de um ao mesmo tempo.
-- dados_contrato: qualificação para contratos (CPF, RG, estado civil, cônjuge, renda, PJ...). Opcional; quem vê o
-- cliente vê estes dados (mesmas regras de acesso da tabela).
-- =====================================================================
create or replace function public.gerar_codigo_cliente()
returns text language plpgsql volatile as $$
declare
  alfabeto constant text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  c text := 'CL-';
begin
  for i in 1..6 loop
    c := c || substr(alfabeto, 1 + floor(random() * length(alfabeto))::int, 1);
  end loop;
  return c;
end $$;

alter table public.leads add column if not exists codigo text default public.gerar_codigo_cliente();
alter table public.leads add column if not exists tipos text[] not null default '{}'
  check (tipos <@ array['comprador','locatario','proprietario','investidor','fiador']::text[]);
alter table public.leads add column if not exists dados_contrato jsonb not null default '{}'::jsonb
  check (jsonb_typeof(dados_contrato) = 'object' and pg_column_size(dados_contrato) < 20000);

alter table public.proprietarios add column if not exists codigo text default public.gerar_codigo_cliente();
alter table public.proprietarios add column if not exists tipos text[] not null default '{}'
  check (tipos <@ array['comprador','locatario','proprietario','investidor','fiador']::text[]);
alter table public.proprietarios add column if not exists dados_contrato jsonb not null default '{}'::jsonb
  check (jsonb_typeof(dados_contrato) = 'object' and pg_column_size(dados_contrato) < 20000);

update public.leads set codigo = public.gerar_codigo_cliente() where codigo is null;
update public.proprietarios set codigo = public.gerar_codigo_cliente() where codigo is null;
alter table public.leads alter column codigo set not null;
alter table public.proprietarios alter column codigo set not null;
create unique index if not exists leads_codigo_idx on public.leads (codigo);
create unique index if not exists proprietarios_codigo_idx on public.proprietarios (codigo);
