-- Painel Frankkia: Corretores e Contas mostram a foto de perfil (perfis.foto_url) no lugar das iniciais.
-- Só acrescenta a coluna da foto; o resto das duas funções fica igual. Mudar o retorno exige apagar e recriar.

drop function if exists public.painel_corretores();
create function public.painel_corretores()
returns table (usuario_id uuid, nome text, email text, imobiliaria_id uuid, imobiliaria text, plano text,
               papel text, ativo boolean, desde timestamptz, foto_url text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_frankkia() then raise exception 'APENAS_FRANKKIA' using errcode = '42501'; end if;
  return query
    select m.usuario_id, coalesce(nullif(p.nome, ''), p.email), p.email, i.id, i.nome, i.plano, m.papel, m.ativo, m.criado_em,
           p.foto_url
      from public.membros m
      join public.imobiliarias i on i.id = m.imobiliaria_id
      join public.perfis p on p.id = m.usuario_id
     order by i.nome, m.papel, p.nome;
end $$;
revoke execute on function public.painel_corretores() from public, anon;
grant execute on function public.painel_corretores() to authenticated;

drop function if exists public.painel_imobiliarias();
create function public.painel_imobiliarias()
returns table (
  id uuid, nome text, cidade text, cnpj text, plano text, status text, cliente_desde timestamptz,
  teste_ate timestamptz, teste_dias int, ultimo_acesso timestamptz, admin_nome text, admin_email text,
  vagas int, uso_negocios int, uso_performance int, uso_academy int, uso_marketing int, admin_foto text)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare v_desde timestamptz := now() - interval '30 days';
begin
  if not public.is_frankkia() then raise exception 'APENAS_FRANKKIA' using errcode = '42501'; end if;
  return query
  select i.id, i.nome, coalesce(i.cidade, ''), coalesce(i.cnpj, ''), i.plano, i.status, i.cliente_desde,
    i.teste_ate, i.teste_dias,
    (select max(u.last_sign_in_at) from public.membros m join auth.users u on u.id = m.usuario_id where m.imobiliaria_id = i.id),
    coalesce((select p.nome from public.membros m join public.perfis p on p.id = m.usuario_id
              where m.imobiliaria_id = i.id and m.papel = 'admin' and m.ativo order by m.criado_em limit 1), ''),
    coalesce((select p.email from public.membros m join public.perfis p on p.id = m.usuario_id
              where m.imobiliaria_id = i.id and m.papel = 'admin' and m.ativo order by m.criado_em limit 1),
             (select c.email from public.convites c where c.imobiliaria_id = i.id and c.papel = 'admin'
              order by c.enviado_em desc limit 1), ''),
    public.vagas_em_uso(i.id),
    ((select count(*) from public.leads l where l.imobiliaria_id = i.id and l.criado_em >= v_desde)
     + (select count(*) from public.captacoes c where c.imobiliaria_id = i.id and c.captado_em >= v_desde)
     + (select count(*) from public.proprietarios p where p.imobiliaria_id = i.id and p.criado_em >= v_desde))::int,
    ((select count(*) from public.transacoes t where t.imobiliaria_id = i.id and t.criado_em >= v_desde)
     + (select count(*) from public.fechamentos_informados f where f.imobiliaria_id = i.id and f.criado_em >= v_desde))::int,
    (select count(*) from public.progresso_aulas a where a.imobiliaria_id = i.id and a.concluida_em >= v_desde)::int,
    (select count(*) from public.captacoes c where c.imobiliaria_id = i.id and c.captado_em >= v_desde
       and true = any (c.checklist_marketing))::int,
    (select p.foto_url from public.membros m join public.perfis p on p.id = m.usuario_id
      where m.imobiliaria_id = i.id and m.papel = 'admin' and m.ativo order by m.criado_em limit 1)
  from public.imobiliarias i
  order by i.nome;
end $$;
revoke execute on function public.painel_imobiliarias() from public, anon;
grant execute on function public.painel_imobiliarias() to authenticated;
