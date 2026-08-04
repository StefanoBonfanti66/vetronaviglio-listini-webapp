-- 0002: aggiunge la colonna "enabled" a capacities per poter disattivare
-- capacità senza eliminare (il delete farebbe cascade sulle listino_configs).
-- Coerente con materials/colors che hanno già enabled.

alter table public.capacities
  add column if not exists enabled boolean not null default true;
