-- 0005: costi imballo fissi €/pezzo (email Federico "I: listini", 22/10/2026).
--
-- Due valori fissi modificabili, uno per allineato e uno per rinfusa,
-- distinti per fascia di capacità (fino a 125 ml / oltre 125 ml).
-- Il costo viene sommato ai costi diretti prima del ricarico vendite finale.
--
-- NULL = non definito: in quel caso si usa il calcolo da pallettizzazione
-- (imballo_items / pezzi_pallet) ereditato dall'Excel.

create table if not exists public.imballo_fissi (
  id uuid primary key default gen_random_uuid(),
  modalita text not null check (modalita in ('allineato', 'rinfusa')),
  fascia text not null check (fascia in ('fino_125', 'oltre_125')),
  costo_eur_per_pezzo numeric,
  created_at timestamptz not null default now(),
  unique (modalita, fascia)
);

comment on table public.imballo_fissi is
  'Costo imballo fisso €/pezzo per modalita (allineato/rinfusa) e fascia capacita (fino_125/oltre_125).';

insert into public.imballo_fissi (modalita, fascia, costo_eur_per_pezzo)
values
  ('allineato', 'fino_125', null),
  ('allineato', 'oltre_125', null),
  ('rinfusa', 'fino_125', null),
  ('rinfusa', 'oltre_125', null)
on conflict (modalita, fascia) do nothing;

alter table public.imballo_fissi enable row level security;

drop policy if exists "imballo_fissi readable by authenticated" on public.imballo_fissi;
drop policy if exists "imballo_fissi admin write" on public.imballo_fissi;

create policy "imballo_fissi readable by authenticated"
  on public.imballo_fissi for select to authenticated using (true);

create policy "imballo_fissi admin write"
  on public.imballo_fissi for all to authenticated using (public.is_admin()) with check (public.is_admin());
