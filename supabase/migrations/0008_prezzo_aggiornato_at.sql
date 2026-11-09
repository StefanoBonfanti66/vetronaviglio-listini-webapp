-- Aggiunge colonne dedicate all'ultimo aggiornamento del solo prezzo.
-- prezzo_aggiornato_at viene popolato solo quando costo_kg (materials) o
-- master_color_costo_kg (colors) cambiano effettivamente.
-- Non viene applicata al DB live: serve solo come riferimento per il deploy.

alter table public.materials
  add column if not exists prezzo_aggiornato_at timestamptz,
  add column if not exists prezzo_aggiornato_da uuid references public.profiles(id);

alter table public.colors
  add column if not exists prezzo_aggiornato_at timestamptz,
  add column if not exists prezzo_aggiornato_da uuid references public.profiles(id);
