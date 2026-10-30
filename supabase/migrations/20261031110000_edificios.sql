-- =====================================================================
-- FRANKKIA — Edifícios e Condomínios. O "imóvel" (lugar físico: endereço, CEP, mapa) já é compartilhado pela
-- imobiliária; agora ele guarda também a ficha do prédio/condomínio, usada para preencher o "Novo imóvel" e para
-- cruzar captações, estudos e vendas do mesmo endereço.
-- =====================================================================
alter table public.imoveis
  add column if not exists construtora text check (construtora is null or length(construtora) <= 120),
  add column if not exists ano_construcao int check (ano_construcao is null or ano_construcao between 1800 and 2100),
  add column if not exists andares int check (andares is null or andares between 1 and 300),
  add column if not exists unidades_andar int check (unidades_andar is null or unidades_andar between 1 and 200),
  add column if not exists elevadores int check (elevadores is null or elevadores between 0 and 60),
  add column if not exists condominio_medio numeric(12,2) check (condominio_medio is null or condominio_medio >= 0),
  add column if not exists caracteristicas text[] not null default '{}',
  add column if not exists administradora text check (administradora is null or length(administradora) <= 120),
  add column if not exists administradora_tel text check (administradora_tel is null or length(administradora_tel) <= 20),
  add column if not exists obs_predio text check (obs_predio is null or length(obs_predio) <= 2000),
  add column if not exists predio_atualizado_em timestamptz;

-- A ficha do prédio é informação da imobiliária: qualquer membro ativo pode completar (o endereço segue as regras de antes)
create or replace function public.salvar_predio(
  p_imovel uuid, p_construtora text, p_ano int, p_andares int, p_unidades int, p_elevadores int, p_condominio numeric,
  p_caracteristicas text[], p_administradora text, p_administradora_tel text, p_obs text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_imob uuid;
begin
  select imobiliaria_id into v_imob from public.imoveis where id = p_imovel;
  if v_imob is null or not public.is_membro_ativo(v_imob, auth.uid()) then
    raise exception 'SEM_PERMISSAO' using errcode = '42501';
  end if;
  update public.imoveis set
    construtora = nullif(trim(coalesce(p_construtora, '')), ''),
    ano_construcao = p_ano,
    andares = p_andares,
    unidades_andar = p_unidades,
    elevadores = p_elevadores,
    condominio_medio = p_condominio,
    caracteristicas = coalesce(p_caracteristicas, '{}'),
    administradora = nullif(trim(coalesce(p_administradora, '')), ''),
    administradora_tel = nullif(regexp_replace(coalesce(p_administradora_tel, ''), '\D', '', 'g'), ''),
    obs_predio = nullif(trim(coalesce(p_obs, '')), ''),
    predio_atualizado_em = now()
  where id = p_imovel;
end $$;
revoke execute on function public.salvar_predio(uuid, text, int, int, int, int, numeric, text[], text, text, text) from public, anon;
grant execute on function public.salvar_predio(uuid, text, int, int, int, int, numeric, text[], text, text, text) to authenticated;
