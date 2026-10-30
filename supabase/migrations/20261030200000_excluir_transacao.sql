-- =====================================================================
-- FRANKKIA — Excluir uma venda ou locação registrada (só o administrador). Os detalhes e a divisão saem junto
-- (cascade); o imóvel volta a "ativa" se não sobrar outra transação dele; o fechamento informado que virou esta
-- venda volta a "pendente" para o administrador decidir de novo.
-- Lead, proprietário, captação e parceiro são excluídos direto pelas regras de acesso que já existem.
-- =====================================================================
create or replace function public.excluir_transacao(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  t public.transacoes%rowtype;
begin
  select * into t from public.transacoes where id = p_id for update;
  if not found then raise exception 'NAO_ENCONTRADO' using errcode = 'P0001'; end if;
  if not public.is_admin(t.imobiliaria_id) then raise exception 'APENAS_ADMIN: só o administrador exclui vendas e locações' using errcode = '42501'; end if;

  delete from public.transacoes where id = p_id;

  if not exists (select 1 from public.transacoes where captacao_id = t.captacao_id) then
    update public.captacoes set status = 'ativa' where id = t.captacao_id;
    update public.fechamentos_informados set status = 'pendente'
     where captacao_id = t.captacao_id and status = 'registrado';
  end if;
end $$;
revoke execute on function public.excluir_transacao(uuid) from public, anon;
grant execute on function public.excluir_transacao(uuid) to authenticated;
