-- =====================================================================
-- FRANKKIA — Novos preços dos planos (mensal). Anual = 12 meses pelo preço de 10.
-- A cobrança na Stripe é montada a partir desta tabela (criar-checkout e aplicar-reducao),
-- então os próximos pagamentos já saem com os valores novos. Assinaturas já ativas
-- continuam com o preço antigo até a próxima troca de plano.
-- =====================================================================
update public.planos set preco = case nome
  when 'Solo'      then   79.90
  when 'Equipe 5'  then  315.00
  when 'Equipe 10' then  525.00
  when 'Equipe 30' then 1450.00
  when 'Equipe 60' then 2650.00
  else preco end;
