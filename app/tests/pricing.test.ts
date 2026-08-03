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
  allineato: { ore_uomo: 4, costo_rsu: 32, velocita_pz_h: 450, rsu_unit: 0.5, costo_orario_macchina: 5, costo_orario_rsu: 25, ricarico_costi_ind: 0.3 },
  rinfusa: { ore_uomo: 4, costo_rsu: 32, velocita_pz_h: 450, rsu_unit: 0.25, costo_orario_macchina: 5, costo_orario_rsu: 25, ricarico_costi_ind: 0.3 },
}

// [lotto, sfrido, ricarico_vendite, regola, atteso U, atteso AA, atteso AC, atteso AD]
const expected30PP: [number, number, number, 'doppio80' | 'percentuale', number, number, number, number][] = [
  [2000, 0.1, 180, 'doppio80', 0.1590377454, 0.1409821899, 0.5725358836, 0.5075358836],
  [4000, 0.1, 160, 'doppio80', 0.1174377455, 0.0993821899, 0.4227758836, 0.3577758836],
  [7500, 0.07, 140, 'doppio80', 0.0973754521, 0.0793198966, 0.3505516276, 0.2855516276],
  [12500, 0.07, 85, 'percentuale', 0.0885007855, 0.0704452299, 0.1637264531, 0.1303236753],
  [17500, 0.07, 80, 'percentuale', 0.0846973569, 0.0666418013, 0.1524552424, 0.1199552424],
  [25000, 0.05, 75, 'percentuale', 0.0814121455, 0.0633565899, 0.1424712545, 0.1108740323],
  [35000, 0.05, 75, 'percentuale', 0.0795104312, 0.0614548756, 0.1391432545, 0.1075460323],
  [45000, 0.05, 70, 'percentuale', 0.0784539232, 0.0603983677, 0.1333716695, 0.1026772251],
  [75000, 0.05, 70, 'percentuale', 0.0769748121, 0.0589192566, 0.1308571806, 0.1001627362],
  [125000, 0.03, 65, 'percentuale', 0.0756547055, 0.0575991499, 0.1248302640, 0.0950385973],
  [200000, 0.03, 60, 'percentuale', 0.0751555055, 0.0570999499, 0.1202488087, 0.0913599198],
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
  allineato: config30PP.allineato,
  rinfusa: config30PP.rinfusa,
}

const r500 = calcBracket(config500PECOL, {
  sort_order: 0,
  quantita_lotto: 2000,
  sfrido: 0.1,
  ricarico_vendite: 180,
  regola_vendita: 'doppio80',
})
check('500ML PE COL costoMpKgPesato', r500.costoMpKgPesato, 2.04)
check('500ML PE COL allineato.costoUnitario', r500.allineato.costoUnitario, 0.2577649)
check('500ML PE COL allineato.prezzoVendita', r500.allineato.prezzoVendita, 0.9279538)

const r500b7 = calcBracket(config500PECOL, {
  sort_order: 0,
  quantita_lotto: 12500,
  sfrido: 0.07,
  ricarico_vendite: 85,
  regola_vendita: 'percentuale',
})
check('500ML PE COL b7 allineato.costoUnitario', r500b7.allineato.costoUnitario, 0.1845354)
check('500ML PE COL b7 allineato.prezzoVendita', r500b7.allineato.prezzoVendita, 0.3413905)

if (failures > 0) {
  console.log(`\n${failures} check(s) FAILED`)
  process.exit(1)
}
console.log('OK: tutti i check passano (30ML PP NBN + 500ML PE COL)')
