import assert from 'node:assert/strict'
import {
  applyBaseCost,
  applyMasterCost,
  configsForColor,
  configsForMaterial,
  DEFAULT_MP_PCT,
  prefillFromAnagrafiche,
} from '../src/lib/costs'
import type { Color, ListinoConfig, Material } from '../src/lib/types'

const material = (over: Partial<Material> = {}): Material => ({
  id: 'm1',
  code: 'PP',
  name: 'PP',
  sort_order: 1,
  enabled: true,
  costo_kg: 1.69,
  ...over,
})

const color = (over: Partial<Color> = {}): Color => ({
  id: 'c1',
  code: 'NBN',
  name: 'Non bianco / neutro',
  sort_order: 1,
  enabled: true,
  master_color_costo_kg: 10,
  ...over,
})

const config = (over: Partial<ListinoConfig> = {}): ListinoConfig => ({
  id: 'cfg1',
  capacity_id: 'cap1',
  material_id: 'm1',
  color_id: 'c1',
  peso_disegno_g: 20,
  mp_costos_kg: [1.69, 10, 0, 0],
  mp_utilizzi_pct: [...DEFAULT_MP_PCT],
  imballo_items: [],
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
  rinfusa_ricarico_div_100: false,
  master_color_costo_kg: 10,
  ...over,
})

// --- applyBaseCost / applyMasterCost ---

assert.deepEqual(applyBaseCost([1.69, 10, 0, 0], 1.8), [1.8, 10, 0, 0])
assert.deepEqual(applyBaseCost([1.69], 1.8), [1.8])
assert.deepEqual(applyMasterCost([1.69, 10, 0, 0], 20), [1.69, 20, 0, 0])
assert.deepEqual(applyMasterCost([1.69], 20), [1.69, 20])

// la funzione non muta l'array di origine
const original = [1.69, 10, 0, 0]
applyBaseCost(original, 2)
assert.deepEqual(original, [1.69, 10, 0, 0])

// --- selezione dei listini da aggiornare ---

const pp = config({ id: 'a', material_id: 'm1', color_id: 'c1' })
const pe = config({ id: 'b', material_id: 'm2', color_id: 'c1' })
const col = config({ id: 'c', material_id: 'm1', color_id: 'c2' })

assert.deepEqual(configsForMaterial([pp, pe, col], 'm1').map((c) => c.id), ['a', 'c'])
assert.deepEqual(configsForColor([pp, pe, col], 'c1').map((c) => c.id), ['a', 'b'])

// --- prefill dalle anagrafiche ---

const prefill = prefillFromAnagrafiche(material(), color())
assert.deepEqual(prefill.mp_costos_kg, [1.69, 10, 0, 0])
assert.deepEqual(prefill.mp_utilizzi_pct, [96, 4, 0, 0])
assert.equal(prefill.master_color_costo_kg, 10)

// costo materiale non definito -> resta 0, master comunque valorizzato
const prefillNoMat = prefillFromAnagrafiche(material({ costo_kg: null }), color())
assert.equal(prefillNoMat.mp_costos_kg[0], 0)
assert.equal(prefillNoMat.mp_costos_kg[1], 10)
assert.equal(prefillNoMat.master_color_costo_kg, 10)

// master non definito -> master_color_costo_kg null (legacy)
const prefillNoColor = prefillFromAnagrafiche(material(), color({ master_color_costo_kg: null }))
assert.equal(prefillNoColor.master_color_costo_kg, null)
assert.equal(prefillNoColor.mp_costos_kg[1], 0)

// il prefill preserva gli slot gia' valorizzati
const prefillKeep = prefillFromAnagrafiche(material({ costo_kg: 2 }), color(), [1.69, 10, 7, 8])
assert.deepEqual(prefillKeep.mp_costos_kg, [2, 10, 7, 8])

console.log('OK: costs.test.ts')
