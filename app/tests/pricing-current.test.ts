// Regressione sui costi correnti (MP ultimo acquisto 1,69 €/kg, master color
// 10/20 €/kg miscela 96/4, velocita 450 pz/h fino a 125ml e 350 oltre).
//
// Confronta il seed corrente con lo snapshot tests/fixtures/expected_current_costs.json.
// Rigenerare lo snapshot con: npx tsx tests/generate-snapshot.ts

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { calcListino } from '../src/lib/pricing'

const here = dirname(fileURLToPath(import.meta.url))
const seed = JSON.parse(readFileSync(resolve(here, '../../supabase/seed/listino_seed.json'), 'utf8'))
const expected = JSON.parse(readFileSync(resolve(here, 'fixtures/expected_current_costs.json'), 'utf8'))

let failures = 0
let checks = 0
const tol = 1e-6

function check(sheet: string, label: string, got: number, want: number) {
  checks++
  if (Math.abs(got - want) > tol) {
    failures++
    console.log(`FAIL ${sheet} ${label}: got ${got}, want ${want}`)
  }
}

for (const cfg of seed.listino_configs) {
  const key = `${cfg.capacity_label} ${cfg.material_code} ${cfg.color_code}`
  const rows = expected[key]
  if (!rows) {
    failures++
    console.log(`FAIL ${key}: config senza snapshot`)
    continue
  }
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
  const byLot = new Map(res.map((r) => [r.bracket.quantita_lotto, r]))
  for (const row of rows) {
    const r = byLot.get(row.D)
    if (!r) {
      failures++
      console.log(`FAIL ${key}: fascia ${row.D} mancante`)
      continue
    }
    check(key, `U lotto=${row.D}`, r.allineato.costoUnitario, row.U)
    check(key, `AA lotto=${row.D}`, r.rinfusa.costoUnitario, row.AA)
    check(key, `AC lotto=${row.D}`, r.allineato.prezzoVendita, row.AC)
    check(key, `AD lotto=${row.D}`, r.rinfusa.prezzoVendita, row.AD)
  }
}

if (failures > 0) {
  console.log(`\n${failures}/${checks} check(s) FAILED`)
  process.exit(1)
}
console.log(`OK: ${checks} check passano sui costi correnti (${Object.keys(expected).length} config)`)
