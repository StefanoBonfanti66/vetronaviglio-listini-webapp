-- Migrazione listino_configs: sposta campi macchina da allineato/rinfusa (JSONB) a colonne a livello radice
--
-- Fase 1 Attrezzaggio: ore_uomo, costo_rsu
-- Fase 2 Ciclo produttivo: velocita_pz_h, costo_orario_macchina, costo_orario_rsu, ricarico_costi_ind
-- Fase 3 Imballo: rsu_unit (allineato 0.5), rsu_unit_rinfusa (rinfusa 0.25)
--
-- Applicare al DB live on-prem con gate umano.

-- 1. Aggiungi nuove colonne
ALTER TABLE public.listino_configs
  ADD COLUMN IF NOT EXISTS ore_uomo numeric,
  ADD COLUMN IF NOT EXISTS costo_rsu numeric,
  ADD COLUMN IF NOT EXISTS velocita_pz_h numeric,
  ADD COLUMN IF NOT EXISTS rsu_unit numeric,
  ADD COLUMN IF NOT EXISTS rsu_unit_rinfusa numeric,
  ADD COLUMN IF NOT EXISTS costo_orario_macchina numeric,
  ADD COLUMN IF NOT EXISTS costo_orario_rsu numeric,
  ADD COLUMN IF NOT EXISTS ricarico_costi_ind numeric;

-- 2. Migra dati da allineato/rinfusa (JSONB) alle nuove colonne
UPDATE public.listino_configs
SET
  ore_uomo = COALESCE(ore_uomo, (allineato->>'ore_uomo')::numeric),
  costo_rsu = COALESCE(costo_rsu, (allineato->>'costo_rsu')::numeric),
  velocita_pz_h = COALESCE(velocita_pz_h, (allineato->>'velocita_pz_h')::numeric),
  rsu_unit = COALESCE(rsu_unit, (allineato->>'rsu_unit')::numeric),
  rsu_unit_rinfusa = COALESCE(rsu_unit_rinfusa, (rinfusa->>'rsu_unit')::numeric),
  costo_orario_macchina = COALESCE(costo_orario_macchina, (allineato->>'costo_orario_macchina')::numeric),
  costo_orario_rsu = COALESCE(costo_orario_rsu, (allineato->>'costo_orario_rsu')::numeric),
  ricarico_costi_ind = COALESCE(ricarico_costi_ind, (allineato->>'ricarico_costi_ind')::numeric);

-- 3. Imposta valori default dove mancanti
UPDATE public.listino_configs
SET
  ore_uomo = COALESCE(ore_uomo, 0),
  costo_rsu = COALESCE(costo_rsu, 0),
  velocita_pz_h = COALESCE(velocita_pz_h, 0),
  rsu_unit = COALESCE(rsu_unit, 0.5),
  rsu_unit_rinfusa = COALESCE(rsu_unit_rinfusa, 0.25),
  costo_orario_macchina = COALESCE(costo_orario_macchina, 0),
  costo_orario_rsu = COALESCE(costo_orario_rsu, 0),
  ricarico_costi_ind = COALESCE(ricarico_costi_ind, 0);
