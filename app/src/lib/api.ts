import type {
  Capacity,
  Color,
  ListinoConfig,
  Material,
  PriceBracket,
  Profile,
} from './types'

const BASE_URL = 'https://oiyxsebbagxzzpaztahf.supabase.co'
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

function headers(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
    apikey: ANON_KEY,
  }
}

async function fetchJson<T>(url: string, accessToken: string): Promise<T> {
  const res = await fetch(url, { headers: headers(accessToken) })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

export async function getMaterials(accessToken: string): Promise<Material[]> {
  return fetchJson<Material[]>(`${BASE_URL}/rest/v1/materials?select=*&order=sort_order`, accessToken)
}

export async function getColors(accessToken: string): Promise<Color[]> {
  return fetchJson<Color[]>(`${BASE_URL}/rest/v1/colors?select=*&order=sort_order`, accessToken)
}

export async function getCapacities(accessToken: string): Promise<Capacity[]> {
  return fetchJson<Capacity[]>(`${BASE_URL}/rest/v1/capacities?select=*&order=sort_order`, accessToken)
}

export async function getPriceBrackets(accessToken: string): Promise<PriceBracket[]> {
  return fetchJson<PriceBracket[]>(`${BASE_URL}/rest/v1/price_brackets?select=*&order=sort_order`, accessToken)
}

export async function getConfigs(accessToken: string): Promise<ListinoConfig[]> {
  return fetchJson<ListinoConfig[]>(`${BASE_URL}/rest/v1/listino_configs?select=*`, accessToken)
}

export async function getConfig(
  accessToken: string,
  capacityId: string,
  materialId: string,
  colorId: string,
): Promise<ListinoConfig | null> {
  const url = `${BASE_URL}/rest/v1/listino_configs?select=*&capacity_id=eq.${capacityId}&material_id=eq.${materialId}&color_id=eq.${colorId}`
  const data = await fetchJson<ListinoConfig[]>(url, accessToken)
  return data[0] ?? null
}

export async function getProfile(accessToken: string, userId: string): Promise<Profile | null> {
  const url = `${BASE_URL}/rest/v1/profiles?select=*&id=eq.${userId}`
  const data = await fetchJson<Profile[]>(url, accessToken)
  return data[0] ?? null
}

export async function updateConfig(
  accessToken: string,
  id: string,
  patch: Partial<ListinoConfig>
): Promise<ListinoConfig> {
  const res = await fetch(`${BASE_URL}/rest/v1/listino_configs?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      ...headers(accessToken),
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(patch),
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  const data = await res.json()
  return data[0] as ListinoConfig
}