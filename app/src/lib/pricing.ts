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
//   I  = costo MP pesato        = sum(costo_i * pct_i / 100)
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
    totaleCosto: number
    totaleConRicaricoInd: number
    costoUnitario: number
    prezzoVendita: number
  }
}

export function round(x: number, decimals = 6): number {
  return Number(x.toFixed(decimals))
}

export function calcCostoMpPesato(costos: number[], pct: number[]): number {
  if (costos.length === 0) return 0
  let total = 0
  for (let i = 0; i < costos.length; i++) {
    const c = costos[i] ?? 0
    const p = pct[i] ?? 0
    total += (c * p) / 100
  }
  return total
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
): BracketResult {
  const D = bracket.quantita_lotto
  const E = bracket.sfrido
  const F = config.peso_disegno_g

  const costoMpKgPesato = calcCostoMpPesato(
    config.mp_costos_kg,
    config.mp_utilizzi_pct,
  )
  const costoImballoAlPezzo = calcCostoImballoAlPezzo(
    config.imballo_items,
    config.pezzi_pallet,
  )

  const G = F + F * E
  const H = (G * D) / 1000
  const I = costoMpKgPesato
  const J = H * I
  const K = costoImballoAlPezzo
  const L = K * D
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
  const X = W + M + L + J
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
    costoImballoAlPezzo: round(costoImballoAlPezzo, 8),
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
): BracketResult[] {
  return brackets
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((b) => calcBracket(config, b))
}
