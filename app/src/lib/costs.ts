import type { Color, ListinoConfig, Material } from './types'

// Indici dei costi dentro mp_costos_kg:
// 0 = materia prima base (quota 96%), 1 = master color (quota 4%).
export const BASE_COST_INDEX = 0
export const MASTER_COST_INDEX = 1

export const DEFAULT_MP_PCT = [96, 4, 0, 0]

export type ConfigPatch = {
  mp_costos_kg: number[]
  master_color_costo_kg?: number | null
}

function withValue(costos: number[], index: number, value: number): number[] {
  const arr = [...costos]
  while (arr.length <= index) arr.push(0)
  arr[index] = value
  return arr
}

export function applyBaseCost(costos: number[], costo: number): number[] {
  return withValue(costos, BASE_COST_INDEX, costo)
}

export function applyMasterCost(costos: number[], costo: number): number[] {
  return withValue(costos, MASTER_COST_INDEX, costo)
}

/** Patch da applicare ai listini di un materiale quando ne cambia il costo base. */
export function patchForMaterialCost(config: ListinoConfig, costo: number): ConfigPatch {
  return { mp_costos_kg: applyBaseCost(config.mp_costos_kg, costo) }
}

/** Patch da applicare ai listini di un colore quando ne cambia il costo master. */
export function patchForColorCost(config: ListinoConfig, costo: number): ConfigPatch {
  return {
    mp_costos_kg: applyMasterCost(config.mp_costos_kg, costo),
    master_color_costo_kg: costo,
  }
}

/** Listini da aggiornare quando cambia il costo €/kg di un materiale. */
export function configsForMaterial(
  configs: ListinoConfig[],
  materialId: string,
): ListinoConfig[] {
  return configs.filter((c) => c.material_id === materialId)
}

/** Listini da aggiornare quando cambia il costo €/kg di un colore. */
export function configsForColor(configs: ListinoConfig[], colorId: string): ListinoConfig[] {
  return configs.filter((c) => c.color_id === colorId)
}

/**
 * Valori di partenza per una nuova configurazione, derivati dalle anagrafiche.
 * Un costo non definito (null) lascia il campo a zero / legacy.
 */
export function prefillFromAnagrafiche(
  material: Material | null,
  color: Color | null,
  mp_costos_kg: number[] = [0, 0, 0, 0],
  mp_utilizzi_pct: number[] = DEFAULT_MP_PCT,
): { mp_costos_kg: number[]; mp_utilizzi_pct: number[]; master_color_costo_kg: number | null } {
  const costos = [...mp_costos_kg]
  while (costos.length < 2) costos.push(0)
  if (material?.costo_kg !== null && material?.costo_kg !== undefined) {
    costos[BASE_COST_INDEX] = material.costo_kg
  }
  const master = color?.master_color_costo_kg ?? null
  if (master !== null) {
    costos[MASTER_COST_INDEX] = master
  }
  return {
    mp_costos_kg: costos,
    mp_utilizzi_pct: [...mp_utilizzi_pct],
    master_color_costo_kg: master,
  }
}
