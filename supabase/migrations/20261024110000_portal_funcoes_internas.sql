-- Funções internas do portal: só usadas pelas funções portal_* (não ficam abertas para chamada direta)
revoke execute on function public.portal_logo(uuid) from anon, authenticated;
revoke execute on function public.portal_cartoes(uuid, uuid) from anon, authenticated;
