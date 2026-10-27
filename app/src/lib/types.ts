export interface Material {
  id: string
  code: string
  name: string
  sort_order: number
  enabled: boolean
  // Costo €/kg della materia prima (quota 96% della miscela).
  // NULL = non definito.
  costo_kg?: number | null
}

export interface Color {
  id: string
  code: string
  name: string
  sort_order: number
  enabled: boolean
  // Costo €/kg del master color (quota 4% della miscela).
  // NULL = non definito.
  master_color_costo_kg?: number | null
}

export interface Capacity {
  id: string
  label: string
  peso_disegno_g: number
  sort_order: number
  enabled: boolean
}

export interface PriceBracket {
  id: string
  sort_order: number
  da: number
  fino: number
  quantita_lotto: number
  sfrido: number
  ricarico_vendite: number
  regola_vendita: 'doppio80' | 'percentuale'
}

export interface MachineParams {
  ore_uomo: number
  costo_rsu: number
  velocita_pz_h: number
  rsu_unit: number
  costo_orario_macchina: number
  costo_orario_rsu: number
  ricarico_costi_ind: number
}

export interface ImballoItem {
  name: string
  costo: number
}

export interface ListinoConfig {
  id: string
  capacity_id: string
  material_id: string
  color_id: string
  peso_disegno_g: number
  mp_costos_kg: number[]
  mp_utilizzi_pct: number[]
  imballo_items: ImballoItem[]
  pezzi_pallet: number
  allineato: MachineParams
  rinfusa: MachineParams
  rinfusa_ricarico_div_100: boolean
  master_color_costo_kg?: number | null
  updated_at?: string
}

export interface Profile {
  id: string
  full_name: string | null
  role: 'commerciale' | 'admin'
}

export type ModalitaImballo = 'allineato' | 'rinfusa'
export type FasciaImballo = 'fino_125' | 'oltre_125'

export interface ImballoFisso {
  id: string
  modalita: ModalitaImballo
  fascia: FasciaImballo
  // Costo €/pezzo (costo imballo fisso, sommato ai costi diretti).
  // NULL = non definito: si usa il calcolo da pallettizzazione.
  costo_eur_per_pezzo?: number | null
}
