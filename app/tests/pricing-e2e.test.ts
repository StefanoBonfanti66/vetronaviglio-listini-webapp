// Validazione end-to-end: motore (dai listino_configs del seed) contro i valori
// reali di TUTTI i 44 fogli excel estratti in tests/fixtures/expected_excel.json.
//
// Verifica che U (costo unit. allineato), AA (costo unit. rinfusa),
// AC (prezzo allineato) e AD (prezzo rinfusa) combacino a meno di 1e-6.

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { calcBracket } from '../src/lib/pricing'
import type { ListinoConfigInput } from '../src/lib/pricing'

const cwd = process.cwd()
const seed = JSON.parse(readFileSync(resolve(cwd, '../supabase/seed/listino_seed.json'), 'utf8'))
const expected = JSON.parse(readFileSync(resolve(cwd, 'tests/fixtures/expected_excel.json'), 'utf8'))

const brackets = seed.price_brackets
const cfgByKey = new Map<string, any>()
for (const cfg of seed.listino_configs) {
  cfgByKey.set(`${cfg.capacity_label} ${cfg.material_code} ${cfg.color_code}`, cfg)
}

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

for (const [sheetName, rows] of Object.entries(expected)) {
  const m = sheetName.match(/^(.+?) (PP|PE) (NBN|COL)$/)
  if (!m) {
    console.log(`SKIP sheet non riconosciuto: ${sheetName}`)
    continue
  }
  let capLabel = m[1].trim()
  capLabel = capLabel.replace(/\s*ML$/, '').trim()
  if (capLabel === '300 to 400') capLabel = '300 / 350'
  const key = `${capLabel} ${m[2]} ${m[3]}`
  const cfg = cfgByKey.get(key)
  if (!cfg) {
    console.log(`SKIP config mancante: ${key}`)
    continue
  }

  const config: ListinoConfigInput = {
    peso_disegno_g: cfg.peso_disegno_g,
    mp_costos_kg: cfg.mp_costos_kg,
    mp_utilizzi_pct: cfg.mp_utilizzi_pct,
    imballo_items: cfg.imballo_items,
    pezzi_pallet: cfg.pezzi_pallet,
    allineato: cfg.allineato,
    rinfusa: cfg.rinfusa,
    rinfusaRicaricoDiv100: cfg.rinfusa_ricarico_div_100 ?? false,
  }

  const bracketByLot = new Map<number, any>(brackets.map((b: any) => [b.quantita_lotto, b]))

  for (const row of rows) {
    const br = bracketByLot.get(row.D)
    if (!br) continue
    const res = calcBracket(config, {
      sort_order: br.sort_order,
      quantita_lotto: br.quantita_lotto,
      sfrido: br.sfrido,
      ricarico_vendite: br.ricarico_vendite,
      regola_vendita: br.regola_vendita,
    })
    const tag = `${sheetName} lotto=${row.D}`
    check(tag, 'U', res.allineato.costoUnitario, row.U)
    check(tag, 'AA', res.rinfusa.costoUnitario, row.AA)
    check(tag, 'AC', res.allineato.prezzoVendita, row.AC)
    check(tag, 'AD', res.rinfusa.prezzoVendita, row.AD)
  }
}

if (failures > 0) {
  console.log(`\n${failures}/${checks} check(s) FAILED`)
  process.exit(1)
}
console.log(`OK: ${checks} check passano su ${Object.keys(expected).length} fogli (prezzi allineato/rinfusa identici all'excel)`)
