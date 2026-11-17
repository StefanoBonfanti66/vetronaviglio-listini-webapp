-- Migration: aggiunge configurazioni listino 400 ml per PP e PE
-- Colori NBN e COL.
-- NOTA: i valori sotto sono ereditati dal formato 300 / 350 ml (peso 38 g, velocità 350 pz/h)
-- e sono PROVVISORI, da validare per il formato 400 ml.
-- Non sono dati specifici già verificati per il formato 400 ml.

INSERT INTO public.listino_configs (capacity_id, material_id, color_id, peso_disegno_g, rinfusa_ricarico_div_100, mp_costos_kg, mp_utilizzi_pct, master_color_costo_kg, imballo_items, pezzi_pallet, ore_uomo, costo_rsu, velocita_pz_h, rsu_unit, rsu_unit_rinfusa, costo_orario_macchina, costo_orario_rsu, ricarico_costi_ind) VALUES
    -- PP / 400 ml / NBN
    ((SELECT id FROM public.capacities WHERE label = '400'), (SELECT id FROM public.materials WHERE code = 'PP'), (SELECT id FROM public.colors WHERE code = 'NBN'), 38.0, false, ARRAY[1.69, 10.0, 0.0, 0.0]::numeric[], ARRAY[96.0, 4.0, 0.0, 0.0]::numeric[], 10.0, '[{"name":"scatole","costo":6.129},{"name":"sacchetti","costo":1.242},{"name":"veline","costo":1.953},{"name":"film","costo":2.0}]'::jsonb, 9900.0, 6.0, 32.0, 350.0, 0.5, 0.25, 5.0, 25.0, 0.3),
    -- PP / 400 ml / COL
    ((SELECT id FROM public.capacities WHERE label = '400'), (SELECT id FROM public.materials WHERE code = 'PP'), (SELECT id FROM public.colors WHERE code = 'COL'), 38.0, false, ARRAY[1.69, 20.0, 0.0, 0.0]::numeric[], ARRAY[96.0, 4.0, 0.0, 0.0]::numeric[], 20.0, '[{"name":"scatole","costo":6.129},{"name":"sacchetti","costo":1.242},{"name":"veline","costo":1.953},{"name":"film","costo":2.0}]'::jsonb, 9900.0, 6.0, 32.0, 350.0, 0.5, 0.25, 5.0, 25.0, 0.3),
    -- PE / 400 ml / NBN
    ((SELECT id FROM public.capacities WHERE label = '400'), (SELECT id FROM public.materials WHERE code = 'PE'), (SELECT id FROM public.colors WHERE code = 'NBN'), 38.0, false, ARRAY[1.69, 10.0, 0.0, 0.0]::numeric[], ARRAY[96.0, 4.0, 0.0, 0.0]::numeric[], 10.0, '[{"name":"scatole","costo":6.129},{"name":"sacchetti","costo":1.242},{"name":"veline","costo":1.953},{"name":"film","costo":2.0}]'::jsonb, 9900.0, 6.0, 32.0, 350.0, 0.5, 0.25, 5.0, 25.0, 0.3),
    -- PE / 400 ml / COL
    ((SELECT id FROM public.capacities WHERE label = '400'), (SELECT id FROM public.materials WHERE code = 'PE'), (SELECT id FROM public.colors WHERE code = 'COL'), 38.0, false, ARRAY[1.69, 20.0, 0.0, 0.0]::numeric[], ARRAY[96.0, 4.0, 0.0, 0.0]::numeric[], 20.0, '[{"name":"scatole","costo":6.129},{"name":"sacchetti","costo":1.242},{"name":"veline","costo":1.953},{"name":"film","costo":2.0}]'::jsonb, 9900.0, 6.0, 32.0, 350.0, 0.5, 0.25, 5.0, 25.0, 0.3)
ON CONFLICT (capacity_id, material_id, color_id) DO NOTHING;
