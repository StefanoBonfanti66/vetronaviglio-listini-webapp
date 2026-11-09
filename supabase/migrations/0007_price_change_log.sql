-- 0007: audit trail variazioni prezzi su materiali e colori
--
-- Aggiunge colonne updated_at/updated_by a public.materials e public.colors,
-- crea la tabella public.price_change_log per registrare chi ha modificato
-- quale campo, da quale valore a quale valore, e quando.
--
-- Applicare al DB live on-prem (192.168.24.132:8000) con gate umano.
-- Nessun seed: la tabella log parte vuota.

-- 1. Colonne di audit su public.materials
alter table public.materials
  add column if not exists updated_at timestamptz default now(),
  add column if not exists updated_by uuid references public.profiles(id);

-- 2. Colonne di audit su public.colors
alter table public.colors
  add column if not exists updated_at timestamptz default now(),
  add column if not exists updated_by uuid references public.profiles(id);

-- 3. Tabella log variazioni prezzi
create table if not exists public.price_change_log (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  record_id text not null,
  field_changed text not null,
  old_value jsonb,
  new_value jsonb,
  changed_by uuid references public.profiles(id),
  changed_at timestamptz not null default now()
);

comment on table public.price_change_log is
  'Storico variazioni prezzi: chi, tabella, record, campo, vecchio e nuovo valore, data.';

create index if not exists idx_price_change_log_table_record
  on public.price_change_log (table_name, record_id);
create index if not exists idx_price_change_log_changed_at
  on public.price_change_log (changed_at desc);

-- 4. RLS
alter table public.price_change_log enable row level security;

drop policy if exists "price_change_log readable by authenticated" on public.price_change_log;
drop policy if exists "price_change_log admin write" on public.price_change_log;

create policy "price_change_log readable by authenticated"
  on public.price_change_log for select to authenticated using (true);

create policy "price_change_log admin write"
  on public.price_change_log for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- 5. (Opzionale, da valutare) Trigger che blocca UPDATE su costo
--    di materiali/colori se il giorno del mese non e' 1.
--    Le colonne costo_kg / master_color_costo_kg non esistono nello
--    schema attuale (0001_init): attivare solo dopo aver confermato
--    i nomi esatti delle colonne costo in DB.
--
-- create or replace function public.blocca_modifica_prezzo_fuori_primo_giorno()
-- returns trigger
-- language plpgsql
-- security definer set search_path = public
-- as $$
-- begin
--   if extract(day from now()) <> 1 then
--     raise exception 'Modifica prezzi consentita solo il primo giorno del mese';
--   end if;
--   return new;
-- end;
-- $$;
--
-- drop trigger if exists trigger_blocca_prezzo_materiali on public.materials;
-- create trigger trigger_blocca_prezzo_materiali
--   before update on public.materials
--   for each row execute function public.blocca_modifica_prezzo_fuori_primo_giorno();
--
-- drop trigger if exists trigger_blocca_prezzo_colori on public.colors;
-- create trigger trigger_blocca_prezzo_colori
--   before update on public.colors
--   for each row execute function public.blocca_modifica_prezzo_fuori_primo_giorno();
