-- vetronaviglio-listini-webapp: schema iniziale
-- Replica la struttura del listino Excel (Nuovo Listino Plastica_06 2025_Rev01)
-- in forma normalizzata. Il calcolo prezzi vive nell'app (motore TS), il DB
-- conserva i dati di base (materiali, colori, capacità, fasce, parametri).

create extension if not exists "uuid-ossp";

-- ============================================================
-- Anagrafiche
-- ============================================================

create table public.materials (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,          -- PP, PE, PETG, PE_PCR
  name text not null,                 -- Polipropilene, Polietilene, ...
  sort_order int not null default 0,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.colors (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,          -- NBN (non bianco/neutro), COL (colorato custom)
  name text not null,                 -- "Non bianco / neutro", "Colorato custom"
  sort_order int not null default 0,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.capacities (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,         -- '30', '50', ..., '300 / 400', '1000' (ml)
  peso_disegno_g numeric not null default 0,   -- da CAP_PESI_LOTTI
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Fasce di quantità (11 fasce, replicate dall'excel)
-- ============================================================
-- regola_vendita:
--   'doppio80'     -> prezzo = costo_unitario * 2 + (costo_unitario * 2 * 0.8)   (prime fasce)
--   'percentuale'  -> prezzo = costo_unitario + costo_unitario * ricarico_vendite/100

create table public.price_brackets (
  id uuid primary key default gen_random_uuid(),
  sort_order int not null,
  da int not null,                     -- quantità min (pezzi)
  fino int not null,                   -- quantità max (pezzi)
  quantita_lotto int not null,         -- D in excel (lotto costo)
  sfrido numeric not null default 0,   -- E in excel (0.1 / 0.07 / 0.05 / 0.03)
  ricarico_vendite numeric not null default 0,  -- AB in excel (%)
  regola_vendita text not null default 'percentuale'
    check (regola_vendita in ('doppio80', 'percentuale')),
  created_at timestamptz not null default now(),
  unique (sort_order)
);

-- ============================================================
-- Configurazione listino per combinazione capacità+materiale+colore
-- (equivalente di un foglio excel, es. '30ML PP NBN')
-- ============================================================

create table public.listino_configs (
  id uuid primary key default gen_random_uuid(),
  capacity_id uuid not null references public.capacities(id) on delete cascade,
  material_id uuid not null references public.materials(id) on delete cascade,
  color_id uuid not null references public.colors(id) on delete cascade,

  -- Peso effettivo per config, dalla colonna F del foglio (può divergere
  -- dal peso_disegno_g di capacities, es. '50ML PE NBN' usa 20g non 10g).
  peso_disegno_g numeric not null default 0,

  -- Variante formula excel: se true il ricarico industriale rinfusa è
  -- applicato come percentuale (Z = X + X*ric/100, es. '1000ML PE COL'),
  -- altrimenti come frazione (Z = X + X*ric, default).
  rinfusa_ricarico_div_100 boolean not null default false,

  -- Materie prime: righe 22-26 del foglio.
  -- mp_costos_kg: costi MP euro/kg (colonna B)
  -- mp_utilizzi_pct: % utilizzo (colonna C)
  -- costo MP pesato = sum(mp_costos_kg[i] * mp_utilizzi_pct[i] / 100)
  mp_costos_kg numeric[] not null default '{}',
  mp_utilizzi_pct numeric[] not null default '{}',

  -- Imballo terziario: righe 28-36.
  -- items: [{name, costo}] con costo già "per pezzo del dato" (colonna E costo pallet)
  -- costo_imballo_al_pezzo = sum(items.costo) / pezzi_pallet
  imballo_items jsonb not null default '[]',
  pezzi_pallet numeric not null default 0,

  -- Parametri macchina allineato (riga 18) e rinfusa (riga 19).
  -- {ore_uomo, costo_rsu, velocita_pz_h, rsu_unit, costo_orario_macchina,
  --  costo_orario_rsu, ricarico_costi_ind}
  allineato jsonb not null default '{}',
  rinfusa jsonb not null default '{}',

  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),

  unique (capacity_id, material_id, color_id)
);

-- ============================================================
-- Profili utente (ruoli)
-- ============================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'commerciale'
    check (role in ('commerciale', 'admin')),
  created_at timestamptz not null default now()
);

-- ============================================================
-- Trigger: crea profilo all'iscrizione
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Helper per RLS: l'utente è admin?
-- ============================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ============================================================
-- RLS
-- ============================================================

alter table public.materials enable row level security;
alter table public.colors enable row level security;
alter table public.capacities enable row level security;
alter table public.price_brackets enable row level security;
alter table public.listino_configs enable row level security;
alter table public.profiles enable row level security;

-- Lettura: qualsiasi utente autenticato
create policy "materials readable by authenticated"
  on public.materials for select to authenticated using (true);
create policy "colors readable by authenticated"
  on public.colors for select to authenticated using (true);
create policy "capacities readable by authenticated"
  on public.capacities for select to authenticated using (true);
create policy "price_brackets readable by authenticated"
  on public.price_brackets for select to authenticated using (true);
create policy "listino_configs readable by authenticated"
  on public.listino_configs for select to authenticated using (true);
create policy "profiles readable by self"
  on public.profiles for select to authenticated using (id = auth.uid());

-- Scrittura: solo admin
create policy "materials admin write"
  on public.materials for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "colors admin write"
  on public.colors for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "capacities admin write"
  on public.capacities for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "price_brackets admin write"
  on public.price_brackets for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "listino_configs admin write"
  on public.listino_configs for all to authenticated using (public.is_admin()) with check (public.is_admin());
