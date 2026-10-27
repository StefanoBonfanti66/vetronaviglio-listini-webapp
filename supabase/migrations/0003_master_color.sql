-- 0003: aggiunge colonna master_color_costo_kg a listino_configs
-- per supportare la nuova miscela 96% materiale base + 4% master color.
-- NULL = configurazione legacy non migrata (formula storica).
-- NON ha DEFAULT 0: zero è un valore valido per master, non indicatore legacy.

alter table public.listino_configs
  add column if not exists master_color_costo_kg numeric;

comment on column public.listino_configs.master_color_costo_kg is
  'Costo master color €/kg. NULL = legacy (formula storica Σ costo_i × pct_i / 100).
  Valorizzato = nuova miscela 96% base + 4% master, dove il costo base è mp_costos_kg[0].
  Valori >= 0 ammessi. Standard: NBN=10, COL=20 €/kg.';
