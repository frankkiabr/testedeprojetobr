-- Pedidos sobre dados pessoais (página /exclusao-de-dados) chegam à Frankkia junto com os interessados, com origem 'lgpd'.
alter table public.interessados drop constraint if exists interessados_origem_check;
alter table public.interessados add constraint interessados_origem_check check (origem in ('site','login','pagina','cadastro','lgpd'));
