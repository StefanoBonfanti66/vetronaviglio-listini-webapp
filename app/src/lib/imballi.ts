import type { FasciaImballo, ImballoFisso, ModalitaImballo } from './types'

export const LIMITE_FASCIA_FINO_125 = 125

export const MODALITA_IMBALLO: ModalitaImballo[] = ['allineato', 'rinfusa']
export const FASCE_IMBALLO: FasciaImballo[] = ['fino_125', 'oltre_125']

export const FASCIA_LABEL: Record<FasciaImballo, string> = {
  fino_125: 'Fino a 125 ml',
  oltre_125: 'Oltre 125 ml',
}

export const MODALITA_LABEL: Record<ModalitaImballo, string> = {
  allineato: 'Allineato',
  rinfusa: 'Rinfusa',
}

// Estrae i ml dalla label di capacità ("30", "125", "300 / 350", "1000").
export function mlDaLabelCapacity(label: string): number {
  const m = label.match(/\d+/)
  return m ? parseInt(m[0], 10) : 0
}

export function fasciaPerMl(ml: number): FasciaImballo {
  return ml <= LIMITE_FASCIA_FINO_125 ? 'fino_125' : 'oltre_125'
}

export function fasciaPerLabelCapacity(label: string): FasciaImballo {
  return fasciaPerMl(mlDaLabelCapacity(label))
}

export function findImballoFisso(
  rows: ImballoFisso[],
  modalita: ModalitaImballo,
  fascia: FasciaImballo,
): ImballoFisso | undefined {
  return rows.find((r) => r.modalita === modalita && r.fascia === fascia)
}

export type ImballoFissoPerFascia = {
  allineato: number | null
  rinfusa: number | null
}

// Valori €/pezzo per la fascia indicata; null = non definito (si usa il
// calcolo da pallettizzazione).
export function imballoFissoPerFascia(
  rows: ImballoFisso[],
  fascia: FasciaImballo,
): ImballoFissoPerFascia {
  const valido = (v: number | null | undefined): number | null =>
    typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null
  return {
    allineato: valido(rows.find((r) => r.fascia === fascia && r.modalita === 'allineato')?.costo_eur_per_pezzo),
    rinfusa: valido(rows.find((r) => r.fascia === fascia && r.modalita === 'rinfusa')?.costo_eur_per_pezzo),
  }
}
