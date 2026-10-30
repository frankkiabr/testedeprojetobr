-- =====================================================================
-- FRANKKIA — Agenda: além de Visita, Captação, Reunião e Ligação, o compromisso "Outro" pode ter uma etiqueta
-- digitada livremente (ex.: "Cartório", "Vistoria", "Assinatura de contrato").
-- =====================================================================
alter table public.compromissos add column if not exists etiqueta text
  check (etiqueta is null or length(trim(etiqueta)) between 1 and 30);
