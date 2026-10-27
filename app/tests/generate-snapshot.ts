// Genera lo snapshot dei prezzi attesi (costi correnti) dal seed corrente.
// Uso: npx tsx tests/generate-snapshot.ts
// Rigenerare lo snapshot solo quando i costi/master/velocita cambiano
// Deliberatamente e l'Excel del cliente non e' ancora stato aggiornato.

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { calcListino } from '../src/lib/pricing'

const here = dirname(fileURLToPath(import.meta.url))
const seed = JSON.parse(readFileSync(resolve(here, '../../supabase/seed/listino_seed.json'), 'utf8'))
const out: Record<string, { D: number; U: number; AA: number; AC: number; AD: number }[]> = {}

for (const cfg of seed.listino_configs) {
  const key = `${cfg.capacity_label} ${cfg.material_code} ${cfg.color_code}`
  const res = calcListino(
    {
      peso_disegno_g: cfg.peso_disegno_g,
      mp_costos_kg: cfg.mp_costos_kg,
      mp_utilizzi_pct: cfg.mp_utilizzi_pct,
      imballo_items: cfg.imballo_items,
      pezzi_pallet: cfg.pezzi_pallet,
      allineato: cfg.allineato,
      rinfusa: cfg.rinfusa,
      rinfusaRicaricoDiv100: cfg.rinfusa_ricarico_div_100 ?? false,
      master_color_costo_kg: cfg.master_color_costo_kg ?? null,
    },
    seed.price_brackets,
  )
  out[key] = res.map((r) => ({
    D: r.bracket.quantita_lotto,
    U: r.allineato.costoUnitario,
    AA: r.rinfusa.costoUnitario,
    AC: r.allineato.prezzoVendita,
    AD: r.rinfusa.prezzoVendita,
  }))
}

const dest = resolve(here, 'fixtures/expected_current_costs.json')
writeFileSync(dest, JSON.stringify(out, null, 2) + '\n')
console.log(`OK: snapshot scritto in ${dest} (${Object.keys(out).length} config)`)
