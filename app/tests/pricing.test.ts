// Validazione motore di calcolo contro valori reali del file excel
// (foglio `30ML PP NBN`, valori letti con openpyxl data_only=True).

import { calcBracket } from '../src/lib/pricing'

type P = Parameters<typeof calcBracket>

const config30PP: P[0] = {
  peso_disegno_g: 8,
  mp_costos_kg: [2, 4, 0, 0],
  mp_utilizzi_pct: [96, 4, 0, 0],
  imballo_items: [
    { name: 'scatole', costo: 6.129 },
    { name: 'sacchetti', costo: 1.242 },
    { name: 'veline', costo: 1.953 },
    { name: 'film', costo: 2 },
  ],
  pezzi_pallet: 9900,
  ore_uomo: 6,
  costo_rsu: 32,
  velocita_pz_h: 450,
  rsu_unit: 0.5,
  rsu_unit_rinfusa: 0.25,
  costo_orario_macchina: 5,
  costo_orario_rsu: 25,
  ricarico_costi_ind: 0.3,
}

// [lotto, sfrido, ricarico_vendite, regola, atteso U, atteso AA, atteso AC, atteso AD]
const expected30PP: [number, number, number, 'doppio80' | 'percentuale', number, number, number, number][] = [
  [2000, 0.1, 180, 'doppio80', 0.200638, 0.182582, 0.722296, 0.657296],
  [4000, 0.1, 160, 'doppio80', 0.138238, 0.120182, 0.497656, 0.432656],
  [7500, 0.07, 140, 'doppio80', 0.108469, 0.090413, 0.390488, 0.325488],
  [12500, 0.07, 85, 'percentuale', 0.095157, 0.077101, 0.17604, 0.142637],
  [17500, 0.07, 80, 'percentuale', 0.089452, 0.071396, 0.161013, 0.128513],
  [25000, 0.05, 75, 'percentuale', 0.08474, 0.066685, 0.148295, 0.116698],
  [35000, 0.05, 75, 'percentuale', 0.081888, 0.063832, 0.143303, 0.111706],
  [45000, 0.05, 70, 'percentuale', 0.080303, 0.062247, 0.136515, 0.10582],
  [75000, 0.05, 70, 'percentuale', 0.078084, 0.060029, 0.132743, 0.102049],
  [125000, 0.03, 65, 'percentuale', 0.07632, 0.058265, 0.125929, 0.096137],
  [200000, 0.03, 60, 'percentuale', 0.075572, 0.057516, 0.120914, 0.092026],
]

let failures = 0
const tol = 1e-6

function check(name: string, got: number, want: number) {
  const ok = Math.abs(got - want) <= tol
  if (!ok) {
    failures++
    console.log(`FAIL ${name}: got ${got}, want ${want}`)
  }
}

for (const [lotto, sfrido, ricarico, regola, u, aa, ac, ad] of expected30PP) {
  const r = calcBracket(config30PP, {
    sort_order: 0,
    quantita_lotto: lotto,
    sfrido,
    ricarico_vendite: ricarico,
    regola_vendita: regola,
  })
  const tag = `lotto=${lotto}`
  check(`${tag} costoMpKgPesato`, r.costoMpKgPesato, 2.08)
  check(`${tag} costoImballoAlPezzo`, r.costoImballoAlPezzo, 0.00114384)
  check(`${tag} allineato.costoUnitario`, r.allineato.costoUnitario, u)
  check(`${tag} rinfusa.costoUnitario`, r.rinfusa.costoUnitario, aa)
  check(`${tag} allineato.prezzoVendita`, r.allineato.prezzoVendita, ac)
  check(`${tag} rinfusa.prezzoVendita`, r.rinfusa.prezzoVendita, ad)
}

// --- Caso secondario: 500ML PE COL (master colorato nel %utilizzo) ---
const config500PECOL: P[0] = {
  peso_disegno_g: 42,
  mp_costos_kg: [1.5, 15, 0, 16.5],
  mp_utilizzi_pct: [96, 4, 0, 0],
  imballo_items: config30PP.imballo_items,
  pezzi_pallet: 9900,
  ore_uomo: 6,
  costo_rsu: 32,
  velocita_pz_h: 450,
  rsu_unit: 0.5,
  rsu_unit_rinfusa: 0.25,
  costo_orario_macchina: 5,
  costo_orario_rsu: 25,
  ricarico_costi_ind: 0.3,
}

const r500 = calcBracket(config500PECOL, {
  sort_order: 0,
  quantita_lotto: 2000,
  sfrido: 0.1,
  ricarico_vendite: 180,
  regola_vendita: 'doppio80',
})
check('500ML PE COL costoMpKgPesato', r500.costoMpKgPesato, 2.04)
check('500ML PE COL allineato.costoUnitario', r500.allineato.costoUnitario, 0.299365)
check('500ML PE COL allineato.prezzoVendita', r500.allineato.prezzoVendita, 1.077714)

const r500b7 = calcBracket(config500PECOL, {
  sort_order: 0,
  quantita_lotto: 12500,
  sfrido: 0.07,
  ricarico_vendite: 85,
  regola_vendita: 'percentuale',
})
check('500ML PE COL b7 allineato.costoUnitario', r500b7.allineato.costoUnitario, 0.191191)
check('500ML PE COL b7 allineato.prezzoVendita', r500b7.allineato.prezzoVendita, 0.353704)

// --- Nuova miscela 96% base + 4% master (master_color_costo_kg valorizzato) ---
// Il costo base è mp_costos_kg[0] (riga 22 excel, quota 96%).
const config500PECOLMaster20: P[0] = {
  ...config500PECOL,
  master_color_costo_kg: 20,
}
check(
  '500ML PE COL master 20 costoMpKgPesato',
  calcBracket(config500PECOLMaster20, {
    sort_order: 0,
    quantita_lotto: 2000,
    sfrido: 0.1,
    ricarico_vendite: 180,
    regola_vendita: 'doppio80',
  }).costoMpKgPesato,
  1.5 * 0.96 + 20 * 0.04,
)

// Percorso legacy esplicito (master assente) resta invariato: 2.04
check(
  '500ML PE COL legacy (master assente) costoMpKgPesato',
  calcBracket(config500PECOL, {
    sort_order: 0,
    quantita_lotto: 2000,
    sfrido: 0.1,
    ricarico_vendite: 180,
    regola_vendita: 'doppio80',
  }).costoMpKgPesato,
  2.04,
)

// Master a 0 è un valore valido (non "legacy"): costo = base * 96%
check(
  '500ML PE COL master 0 costoMpKgPesato',
  calcBracket({ ...config500PECOL, master_color_costo_kg: 0 }, {
    sort_order: 0,
    quantita_lotto: 2000,
    sfrido: 0.1,
    ricarico_vendite: 180,
    regola_vendita: 'doppio80',
  }).costoMpKgPesato,
  1.5 * 0.96,
)

// Master negativo -> errore esplicito
let masterNegativoErrore = false
try {
  calcBracket({ ...config500PECOL, master_color_costo_kg: -1 }, {
    sort_order: 0,
    quantita_lotto: 2000,
    sfrido: 0.1,
    ricarico_vendite: 180,
    regola_vendita: 'doppio80',
  })
} catch {
  masterNegativoErrore = true
}
check('master negativo solleva errore', masterNegativoErrore ? 1 : 0, 1)

if (failures > 0) {
  console.log(`\n${failures} check(s) FAILED`)
  process.exit(1)
}
console.log('OK: tutti i check passano (30ML PP NBN + 500ML PE COL)')
