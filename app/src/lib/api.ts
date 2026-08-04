import type {
  Capacity,
  Color,
  ListinoConfig,
  Material,
  PriceBracket,
  Profile,
} from './types'

const BASE_URL = 'https://fkjaqhydotxubxnieguh.supabase.co'
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

async function mutateJson<T>(
  url: string,
  accessToken: string,
  method: 'POST' | 'PATCH' | 'DELETE',
  body?: unknown,
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: {
      ...headers(accessToken),
      'Content-Type': 'application/json',
      ...(method === 'DELETE' ? {} : { Prefer: 'return=representation' }),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`${res.status} ${res.statusText}${text ? ` — ${text}` : ''}`)
  }
  if (method === 'DELETE') return undefined as T
  return (await res.json()) as T
}

export async function getMaterials(accessToken: string, onlyEnabled = false): Promise<Material[]> {
  const enabled = onlyEnabled ? '&enabled=eq.true' : ''
  return fetchJson<Material[]>(`${BASE_URL}/rest/v1/materials?select=*&order=sort_order${enabled}`, accessToken)
}

export async function getColors(accessToken: string, onlyEnabled = false): Promise<Color[]> {
  const enabled = onlyEnabled ? '&enabled=eq.true' : ''
  return fetchJson<Color[]>(`${BASE_URL}/rest/v1/colors?select=*&order=sort_order${enabled}`, accessToken)
}

export async function getCapacities(accessToken: string, onlyEnabled = false): Promise<Capacity[]> {
  const enabled = onlyEnabled ? '&enabled=eq.true' : ''
  return fetchJson<Capacity[]>(`${BASE_URL}/rest/v1/capacities?select=*&order=sort_order${enabled}`, accessToken)
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

export async function createConfig(
  accessToken: string,
  config: Omit<ListinoConfig, 'id'>,
): Promise<ListinoConfig> {
  return mutateJson<ListinoConfig[]>(
    `${BASE_URL}/rest/v1/listino_configs`,
    accessToken,
    'POST',
    config,
  ).then((data) => data[0])
}

export async function deleteConfig(accessToken: string, id: string): Promise<void> {
  return mutateJson<void>(
    `${BASE_URL}/rest/v1/listino_configs?id=eq.${id}`,
    accessToken,
    'DELETE',
  )
}

// --- Anagrafiche ---

export async function createMaterial(accessToken: string, m: Omit<Material, 'id'>): Promise<Material> {
  return mutateJson<Material[]>(`${BASE_URL}/rest/v1/materials`, accessToken, 'POST', m).then((d) => d[0])
}

export async function updateMaterial(accessToken: string, id: string, patch: Partial<Material>): Promise<Material> {
  return mutateJson<Material[]>(`${BASE_URL}/rest/v1/materials?id=eq.${id}`, accessToken, 'PATCH', patch).then((d) => d[0])
}

export async function deleteMaterial(accessToken: string, id: string): Promise<void> {
  return mutateJson<void>(`${BASE_URL}/rest/v1/materials?id=eq.${id}`, accessToken, 'DELETE')
}

export async function createColor(accessToken: string, c: Omit<Color, 'id'>): Promise<Color> {
  return mutateJson<Color[]>(`${BASE_URL}/rest/v1/colors`, accessToken, 'POST', c).then((d) => d[0])
}

export async function updateColor(accessToken: string, id: string, patch: Partial<Color>): Promise<Color> {
  return mutateJson<Color[]>(`${BASE_URL}/rest/v1/colors?id=eq.${id}`, accessToken, 'PATCH', patch).then((d) => d[0])
}

export async function deleteColor(accessToken: string, id: string): Promise<void> {
  return mutateJson<void>(`${BASE_URL}/rest/v1/colors?id=eq.${id}`, accessToken, 'DELETE')
}

export async function createCapacity(accessToken: string, c: Omit<Capacity, 'id'>): Promise<Capacity> {
  return mutateJson<Capacity[]>(`${BASE_URL}/rest/v1/capacities`, accessToken, 'POST', c).then((d) => d[0])
}

export async function updateCapacity(accessToken: string, id: string, patch: Partial<Capacity>): Promise<Capacity> {
  return mutateJson<Capacity[]>(`${BASE_URL}/rest/v1/capacities?id=eq.${id}`, accessToken, 'PATCH', patch).then((d) => d[0])
}

export async function deleteCapacity(accessToken: string, id: string): Promise<void> {
  return mutateJson<void>(`${BASE_URL}/rest/v1/capacities?id=eq.${id}`, accessToken, 'DELETE')
}

export async function createBracket(accessToken: string, b: Omit<PriceBracket, 'id'>): Promise<PriceBracket> {
  return mutateJson<PriceBracket[]>(`${BASE_URL}/rest/v1/price_brackets`, accessToken, 'POST', b).then((d) => d[0])
}

export async function updateBracket(accessToken: string, id: string, patch: Partial<PriceBracket>): Promise<PriceBracket> {
  return mutateJson<PriceBracket[]>(`${BASE_URL}/rest/v1/price_brackets?id=eq.${id}`, accessToken, 'PATCH', patch).then((d) => d[0])
}

export async function deleteBracket(accessToken: string, id: string): Promise<void> {
  return mutateJson<void>(`${BASE_URL}/rest/v1/price_brackets?id=eq.${id}`, accessToken, 'DELETE')
}