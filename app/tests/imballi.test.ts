import assert from 'node:assert/strict'
import {
  fasciaPerLabelCapacity,
  fasciaPerMl,
  findImballoFisso,
  imballoFissoPerFascia,
  mlDaLabelCapacity,
} from '../src/lib/imballi'
import { calcBracket } from '../src/lib/pricing'
import type { ImballoFisso } from '../src/lib/types'

// --- estrazione ml e fascia capacita ---

assert.equal(mlDaLabelCapacity('30'), 30)
assert.equal(mlDaLabelCapacity('300 / 350'), 300)
assert.equal(mlDaLabelCapacity('1000'), 1000)
assert.equal(mlDaLabelCapacity(''), 0)

assert.equal(fasciaPerMl(125), 'fino_125')
assert.equal(fasciaPerMl(126), 'oltre_125')
assert.equal(fasciaPerLabelCapacity('125'), 'fino_125')
assert.equal(fasciaPerLabelCapacity('300 / 350'), 'oltre_125')

// --- lettura valori dalle righe ---

const rows: ImballoFisso[] = [
  { id: '1', modalita: 'allineato', fascia: 'fino_125', costo_eur_per_pezzo: 0.05 },
  { id: '2', modalita: 'rinfusa', fascia: 'fino_125', costo_eur_per_pezzo: 0.03 },
  { id: '3', modalita: 'allineato', fascia: 'oltre_125', costo_eur_per_pezzo: null },
  { id: '4', modalita: 'rinfusa', fascia: 'oltre_125', costo_eur_per_pezzo: 0.12 },
]

assert.equal(findImballoFisso(rows, 'rinfusa', 'oltre_125')?.id, '4')
assert.equal(findImballoFisso(rows, 'allineato', 'oltre_125')?.costo_eur_per_pezzo, null)

assert.deepEqual(imballoFissoPerFascia(rows, 'fino_125'), {
  allineato: 0.05,
  rinfusa: 0.03,
})
assert.deepEqual(imballoFissoPerFascia(rows, 'oltre_125'), {
  allineato: null,
  rinfusa: 0.12,
})

// valore non valido (negativo) -> non definito
assert.deepEqual(
  imballoFissoPerFascia(
    [{ id: 'x', modalita: 'allineato', fascia: 'fino_125', costo_eur_per_pezzo: -1 }],
    'fino_125',
  ),
  { allineato: null, rinfusa: null },
)

// --- integrazione nel calcolo prezzo ---

const config = {
  peso_disegno_g: 20,
  mp_costos_kg: [1.69, 10, 0, 0],
  mp_utilizzi_pct: [96, 4, 0, 0],
  imballo_items: [{ name: 'pallet', costo: 990 }],
  pezzi_pallet: 9900,
  allineato: {
    ore_uomo: 4,
    costo_rsu: 32,
    velocita_pz_h: 450,
    rsu_unit: 0.5,
    costo_orario_macchina: 5,
    costo_orario_rsu: 25,
    ricarico_costi_ind: 0.3,
  },
  rinfusa: {
    ore_uomo: 4,
    costo_rsu: 32,
    velocita_pz_h: 450,
    rsu_unit: 0.25,
    costo_orario_macchina: 5,
    costo_orario_rsu: 25,
    ricarico_costi_ind: 0.3,
  },
  rinfusaRicaricoDiv100: false,
  master_color_costo_kg: 10,
}

const bracket = {
  sort_order: 1,
  quantita_lotto: 1000,
  sfrido: 0.05,
  ricarico_vendite: 75,
  regola_vendita: 'percentuale' as const,
}

// senza costo fisso -> calcolo da pallettizzazione (0.1 €/pezzo)
const legacy = calcBracket(config, bracket)
assert.equal(legacy.costoImballoAlPezzo, 0.1)
assert.equal(legacy.costoImballoAlPezzoRinfusa, 0.1)

// con costo fisso -> il fisso vince per la modalita' valorizzata
const conFisso = calcBracket(config, bracket, { allineato: 0.05, rinfusa: null })
assert.equal(conFisso.costoImballoAlPezzo, 0.05)
assert.equal(conFisso.costoImballoAlPezzoRinfusa, 0.1)
assert.equal(conFisso.allineato.costoImballo, 50)
assert.equal(conFisso.rinfusa.costoImballo, 100)

// costo fisso 0 e' valido (non torna alla pallettizzazione)
const zero = calcBracket(config, bracket, { allineato: 0, rinfusa: 0 })
assert.equal(zero.costoImballoAlPezzo, 0)
assert.equal(zero.costoImballoAlPezzoRinfusa, 0)

console.log('OK: imballi.test.ts')
