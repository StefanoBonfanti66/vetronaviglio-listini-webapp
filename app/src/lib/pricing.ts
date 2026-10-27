// Motore di calcolo prezzi — replica deterministica delle formule del file
// "Nuovo Listino Plastica_06 2025_Rev01.xlsx".
//
// Ogni foglio excel (es. `30ML PP NBN`) corrisponde a un listino_config:
// capacità + materiale + colore. Per ogni fascia quantità il motore produce
// il breakdown completo da dati base -> costi -> prezzo allineato/rinfusa.
//
// Formule replicate (colonne del foglio):
//   G  = F + F*E                peso con sfrido
//   H  = G*D/1000               peso materiale (kg)
//   I  = costo MP pesato        = sum(costo_i * pct_i / 100)  [legacy]
//        oppure base_cost_dai_dati * 0.96 + master_cost * 0.04         [nuova miscela 96/4]
//   J  = H*I                    costo materia prima
//   K  = costo imballo al pezzo = sum(imballo.costo) / pezzi_pallet
//   L  = K*D                    costo imballo
//   M  = ore_uomo * costo_rsu   costo attrezzaggio
//   N  = velocita               (pz/h)
//   O  = costo_orario_macchina + costo_orario_rsu * rsu_unit
//   P  = D/N                    ore lavorate
//   Q  = O*P                    costo uomo+macchina
//   R  = Q + L + J + M          totale costo
//   S  = ricarico_costi_ind
//   T  = R + R*S                totale con ricarico industriale
//   U  = T/D                    costo unitario allineato
//   V/W/X/Z/AA: idem con parametri rinfusa -> costo unitario rinfusa
//     (X = W + M + L + J, riusa attrezzaggio M dell'allineato)
//     (Z: default X+X*ric; se rinfusaRicaricoDiv100 -> X+X*ric/100, come '1000ML PE COL')
//   Prezzo = doppio80 ? U*2+(U*2*0.8) : U+U*ricarico_vendite/100

export type MachineParams = {
  ore_uomo: number
  costo_rsu: number
  velocita_pz_h: number
  rsu_unit: number
  costo_orario_macchina: number
  costo_orario_rsu: number
  ricarico_costi_ind: number
}

export type ListinoConfigInput = {
  peso_disegno_g: number
  mp_costos_kg: number[]
  mp_utilizzi_pct: number[]
  imballo_items: { name: string; costo: number }[]
  pezzi_pallet: number
  allineato: MachineParams
  rinfusa: MachineParams
  // Variante formula excel: alcuni fogli applicano il ricarico industriale
  // rinfusa come percentuale (Z = X + X*ric/100, es. '1000ML PE COL'),
  // altri come frazione (Z = X + X*ric, default).
  rinfusaRicaricoDiv100?: boolean
  // Nuovo: costo master color €/kg. Null/undefined = legacy.
  // Se presente e valido (>=0), usa miscela 96% base + 4% master.
  master_color_costo_kg?: number | null
}

export type ImballoFissoInput = {
  allineato: number | null
  rinfusa: number | null
}

export type BracketInput = {
  sort_order: number
  quantita_lotto: number
  sfrido: number
  ricarico_vendite: number
  regola_vendita: 'doppio80' | 'percentuale'
}

export type BracketResult = {
  bracket: BracketInput
  costoMpKgPesato: number
  costoImballoAlPezzo: number
  costoImballoAlPezzoRinfusa: number
  // breakdown allineato
  allineato: {
    pesoConSfrido: number
    pesoMaterialeKg: number
    costoMateriaPrima: number
    costoImballo: number
    costoAttrezzaggio: number
    oreLavorate: number
    costoUomoMacchina: number
    totaleCosto: number
    totaleConRicaricoInd: number
    costoUnitario: number
    prezzoVendita: number
  }
  // breakdown rinfusa
  rinfusa: {
    costoUomoMacchina: number
    costoImballo: number
    totaleCosto: number
    totaleConRicaricoInd: number
    costoUnitario: number
    prezzoVendita: number
  }
}

// Quote della miscela master: 96% materiale base + 4% master color.
// Nel foglio excel la riga 22 è il costo MP base (96%) e la riga 23 il
// master/seconda MP (4%); quindi il costo base è sempre mp_costos_kg[0].
const BASE_SHARE = 0.96
const MASTER_SHARE = 0.04

export function round(x: number, decimals = 6): number {
  return Number(x.toFixed(decimals))
}

/**
 * Calcola il costo MP pesato.
 * Due percorsi espliciti:
 * 1. masterColorCostoKg null/undefined -> formula legacy Σ(costo_i × pct_i / 100)
 * 2. masterColorCostoKg presente e valido (>=0) -> miscela 96% base + 4% master
 *    base_cost = mp_costos_kg[0] (riga 22 del foglio excel: MP base, 96%).
 */
export function calcCostoMpPesato(
  costos: number[],
  pct: number[],
  masterColorCostoKg?: number | null,
): number {
  // Percorso legacy: campo master assente o NULL
  if (masterColorCostoKg === undefined || masterColorCostoKg === null) {
    if (costos.length === 0) return 0
    let total = 0
    for (let i = 0; i < costos.length; i++) {
      const c = costos[i] ?? 0
      const p = pct[i] ?? 0
      total += (c * p) / 100
    }
    return total
  }

  // Percorso nuova miscela: master valorizzato
  const master = masterColorCostoKg
  if (typeof master !== 'number' || !Number.isFinite(master) || master < 0) {
    throw new Error(`master_color_costo_kg deve essere un numero finito >= 0, ricevuto: ${master}`)
  }

  // Costo base MP: primo slot di mp_costos_kg (riga 22 excel, quota 96%)
  const baseCost = costos[0]
  if (baseCost === undefined || baseCost === null) {
    throw new Error('Costo base MP mancante (mp_costos_kg[0])')
  }
  if (typeof baseCost !== 'number' || !Number.isFinite(baseCost) || baseCost <= 0) {
    throw new Error(`Costo base MP non valido (mp_costos_kg[0]): ${baseCost}`)
  }

  // Miscela: 96% materiale base + 4% master
  return baseCost * BASE_SHARE + master * MASTER_SHARE
}

export function calcCostoImballoAlPezzo(
  items: { name: string; costo: number }[],
  pezziPallet: number,
): number {
  if (pezziPallet <= 0) return 0
  const tot = items.reduce((acc, it) => acc + (it.costo ?? 0), 0)
  return tot / pezziPallet
}

export function calcPrezzoUnitario(
  costoUnitario: number,
  ricaricoVendite: number,
  regola: 'doppio80' | 'percentuale',
): number {
  if (regola === 'doppio80') {
    return costoUnitario * 2 + costoUnitario * 2 * 0.8
  }
  return costoUnitario + (costoUnitario * ricaricoVendite) / 100
}

export function calcBracket(
  config: ListinoConfigInput,
  bracket: BracketInput,
  imballoFisso?: ImballoFissoInput | null,
): BracketResult {
  const D = bracket.quantita_lotto
  const E = bracket.sfrido
  const F = config.peso_disegno_g

  const masterColorCostoKg = config.master_color_costo_kg

  const costoMpKgPesato = calcCostoMpPesato(
    config.mp_costos_kg,
    config.mp_utilizzi_pct,
    masterColorCostoKg,
  )
  const costoImballoDaPallettizzazione = calcCostoImballoAlPezzo(
    config.imballo_items,
    config.pezzi_pallet,
  )
  // Costo imballo fisso €/pezzo (email Federico "I: listini", 22/10/2026):
  // un valore per allineato e uno per rinfusa, distinti per fascia di capacità.
  // Se non valorizzato si usa il calcolo da pallettizzazione (legacy).
  const usaFisso = (v: number | null | undefined): v is number =>
    typeof v === 'number' && Number.isFinite(v) && v >= 0
  const KAllineato = usaFisso(imballoFisso?.allineato)
    ? imballoFisso.allineato
    : costoImballoDaPallettizzazione
  const KRinfusa = usaFisso(imballoFisso?.rinfusa)
    ? imballoFisso.rinfusa
    : costoImballoDaPallettizzazione

  const G = F + F * E
  const H = (G * D) / 1000
  const I = costoMpKgPesato
  const J = H * I
  const K = KAllineato
  const L = K * D
  const LR = KRinfusa * D
  const P = D / config.allineato.velocita_pz_h

  // --- allineato ---
  const a = config.allineato
  const M = a.ore_uomo * a.costo_rsu
  const Oa = a.costo_orario_macchina + a.costo_orario_rsu * a.rsu_unit
  const Qa = Oa * P
  const Ra = Qa + L + J + M
  const Ta = Ra + Ra * a.ricarico_costi_ind
  const Ua = Ta / D

  // --- rinfusa (attrezzaggio M riusato dall'allineato, come in excel) ---
  const r = config.rinfusa
  const Or = r.costo_orario_macchina + r.costo_orario_rsu * r.rsu_unit
  const W = Or * P
  const X = W + M + LR + J
  const Z = config.rinfusaRicaricoDiv100
    ? X + (X * r.ricarico_costi_ind) / 100
    : X + X * r.ricarico_costi_ind
  const AA = Z / D

  const prezzoAllineato = calcPrezzoUnitario(
    Ua,
    bracket.ricarico_vendite,
    bracket.regola_vendita,
  )
  const prezzoRinfusa = calcPrezzoUnitario(
    AA,
    bracket.ricarico_vendite,
    bracket.regola_vendita,
  )

  return {
    bracket,
    costoMpKgPesato: round(costoMpKgPesato, 4),
    costoImballoAlPezzo: round(KAllineato, 8),
    costoImballoAlPezzoRinfusa: round(KRinfusa, 8),
    allineato: {
      pesoConSfrido: round(G),
      pesoMaterialeKg: round(H),
      costoMateriaPrima: round(J),
      costoImballo: round(L),
      costoAttrezzaggio: round(M),
      oreLavorate: round(P, 4),
      costoUomoMacchina: round(Qa),
      totaleCosto: round(Ra),
      totaleConRicaricoInd: round(Ta),
      costoUnitario: round(Ua, 6),
      prezzoVendita: round(prezzoAllineato, 6),
    },
    rinfusa: {
      costoUomoMacchina: round(W),
      costoImballo: round(LR),
      totaleCosto: round(X),
      totaleConRicaricoInd: round(Z),
      costoUnitario: round(AA, 6),
      prezzoVendita: round(prezzoRinfusa, 6),
    },
  }
}

export function calcListino(
  config: ListinoConfigInput,
  brackets: BracketInput[],
  imballoFisso?: ImballoFissoInput | null,
): BracketResult[] {
  return brackets
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((b) => calcBracket(config, b, imballoFisso))
}
