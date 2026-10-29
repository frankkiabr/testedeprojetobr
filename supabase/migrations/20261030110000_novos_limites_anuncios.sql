-- Novos limites de anúncios publicados no portal por plano (compartilhados pela equipe).
update public.planos set anuncios = case nome
  when 'Solo' then 50
  when 'Equipe 5' then 100
  when 'Equipe 10' then 150
  when 'Equipe 30' then 300
  when 'Equipe 60' then 1000
  else anuncios end;
