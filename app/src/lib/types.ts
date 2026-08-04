export interface Material {
  id: string
  code: string
  name: string
  sort_order: number
  enabled: boolean
}

export interface Color {
  id: string
  code: string
  name: string
  sort_order: number
  enabled: boolean
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
  updated_at?: string
}

export interface Profile {
  id: string
  full_name: string | null
  role: 'commerciale' | 'admin'
}
