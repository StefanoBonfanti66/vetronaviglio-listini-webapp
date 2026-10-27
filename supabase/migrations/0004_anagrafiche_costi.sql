-- 0004: costi €/kg su anagrafiche materiali e colori.
--
-- materials.costo_kg            -> costo materia prima base (quota 96% della miscela)
-- colors.master_color_costo_kg  -> costo master color (quota 4% della miscela)
--
-- NULL = costo non definito (nessuna propagazione ai listini).
-- I listini (listino_configs) restano la fonte dei valori effettivi:
-- la modifica di un'anagrafica viene propagata ai listini che la usano
-- (mp_costos_kg[0] per il materiale, mp_costos_kg[1] + master_color_costo_kg
-- per il colore).

alter table public.materials
  add column if not exists costo_kg numeric;

comment on column public.materials.costo_kg is
  'Costo materia prima €/kg (quota 96% della miscela). NULL = non definito.
  Standard: PP=1.69, PE=1.69, PETG=3.822, PE_PCR=1.98.';

alter table public.colors
  add column if not exists master_color_costo_kg numeric;

comment on column public.colors.master_color_costo_kg is
  'Costo master color €/kg (quota 4% della miscela). NULL = non definito.
  Standard: NBN=10, COL=20.';
