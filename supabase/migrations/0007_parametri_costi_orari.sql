-- Migrazione parametri costi orari globali (email Federico, 10/11/2026)
--
-- Sposta i 3 costi orari da listino_configs (per variante) a una tabella
-- globale a singola riga, poiché il costo orario vale per tutte le varianti.
--
-- Mappatura richiesta Federico:
--   attrezzista  -> costo_orario_attrezzista  (40)  -> usato in M = ore_uomo * costo_rsu
--   operatore    -> costo_orario_operatore    (20)  -> usato in O = macchina + operatore * rsu_unit
--   macchina     -> costo_orario_macchina     (15)  -> usato in O = macchina + operatore * rsu_unit
--
-- Applicare al DB live on-prem con gate umano.

-- 1. Crea la tabella globale (singola riga)
create table public.parametri_costi_orari (
  id uuid primary key default gen_random_uuid(),
  costo_orario_attrezzista numeric not null default 40,
  costo_orario_operatore numeric not null default 20,
  costo_orario_macchina numeric not null default 15,
  updated_at timestamptz not null default now(),
  updated_by text
);

-- Garanzia di singola riga (workaround senza trigger)
create unique index parametri_costi_orari_single_row_idx
  on public.parametri_costi_orari (costo_orario_attrezzista);

-- 2. Inserisce i valori comunicati da Federico
insert into public.parametri_costi_orari (
  costo_orario_attrezzista,
  costo_orario_operatore,
  costo_orario_macchina,
  updated_by
) values (
  40, 20, 15,
  'sistema (email Federico 10/11/2026)'
);

-- 3. RLS
alter table public.parametri_costi_orari enable row level security;

create policy "parametri_costi_orari readable by authenticated"
  on public.parametri_costi_orari for select to authenticated using (true);

create policy "parametri_costi_orari admin write"
  on public.parametri_costi_orari for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
