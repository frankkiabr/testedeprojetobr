-- Último contato com o lead (marcar passo do checklist, mudar etapa, abrir o WhatsApp, anotar...).
-- Vazio = conta desde a criação. Mais de 5 dias sem contato (e não fechado/perdido) = lead atrasado.
alter table public.leads add column if not exists ultimo_contato timestamptz;
