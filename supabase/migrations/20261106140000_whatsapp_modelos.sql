-- WhatsApp: textos dos modelos ajustados para a Meta aceitar como Utilidade (ordem dos parâmetros).
-- chave_atrasada: {{1}} imóvel, {{2}} prazo, {{3}} com quem.
-- Lembretes de visita (1 hora antes) e chaves atrasadas: conferidos a cada minuto
create or replace function public.agendar_whatsapp()
returns void language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in
    select c.id, c.dono_id, c.imobiliaria_id, c.titulo, c.tipo, c.inicio, c.local
      from public.compromissos c
     where c.tipo in ('visita', 'captacao') and c.imobiliaria_id is not null
       and c.inicio > now() and c.inicio <= now() + interval '60 minutes'
  loop
    perform public.enfileirar_whatsapp(r.dono_id, r.imobiliaria_id, 'visita_lembrete',
      'visita:' || r.id || ':' || r.inicio,
      jsonb_build_array(public._primeiro_nome(r.dono_id),
                        r.titulo,
                        to_char(r.inicio at time zone 'America/Belem', 'HH24:MI'),
                        coalesce(nullif(trim(r.local), ''), 'não informado')));
  end loop;

  for r in
    select k.id, k.registrado_por, k.imobiliaria_id, k.com_quem, k.devolver_ate, cp.codigo
      from public.chaves k join public.captacoes cp on cp.id = k.captacao_id
     where k.devolvida_em is null and k.registrado_por is not null
       and k.devolver_ate is not null and k.devolver_ate < now() and k.devolver_ate > now() - interval '3 days'
  loop
    perform public.enfileirar_whatsapp(r.registrado_por, r.imobiliaria_id, 'chave_atrasada',
      'chave:' || r.id || ':' || r.devolver_ate,
      jsonb_build_array(coalesce(r.codigo, 'sem código'),
                        to_char(r.devolver_ate at time zone 'America/Belem', 'DD/MM "às" HH24:MI'),
                        coalesce(nullif(trim(r.com_quem), ''), 'alguém')));
  end loop;
end $$;
revoke execute on function public.agendar_whatsapp() from public, anon, authenticated;
