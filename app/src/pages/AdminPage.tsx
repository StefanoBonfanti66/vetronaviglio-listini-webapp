import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getCapacities,
  getColors,
  getConfigs,
  getMaterials,
  updateConfig,
} from '../lib/api'
import type {
  Capacity,
  Color,
  ImballoItem,
  ListinoConfig,
  Material,
} from '../lib/types'
import { useAuth } from '../context/AuthContext'

export default function AdminPage() {
  const { profile, session } = useAuth()
  const accessToken = session?.access_token
  const [materials, setMaterials] = useState<Material[]>([])
  const [colors, setColors] = useState<Color[]>([])
  const [capacities, setCapacities] = useState<Capacity[]>([])
  const [configs, setConfigs] = useState<ListinoConfig[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Partial<ListinoConfig>>({})

  useEffect(() => {
    if (!accessToken) return
    Promise.all([
      getMaterials(accessToken),
      getColors(accessToken),
      getCapacities(accessToken),
      getConfigs(accessToken),
    ])
      .then(([m, c, ca, cfg]) => {
        setMaterials(m)
        setColors(c)
        setCapacities(ca)
        setConfigs(cfg)
      })
      .catch((e) => setError(String(e)))
  }, [accessToken])

  const notify = (msg: string) => {
    setSaved(msg)
    setTimeout(() => setSaved(null), 3000)
  }

  const startEdit = (cfg: ListinoConfig) => {
    setEditingId(cfg.id)
    setDraft({ ...cfg })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setDraft({})
  }

  const saveEdit = async () => {
    if (!editingId || !accessToken) return
    try {
      const patch: Record<string, unknown> = {
        peso_disegno_g: draft.peso_disegno_g,
        mp_costos_kg: draft.mp_costos_kg,
        mp_utilizzi_pct: draft.mp_utilizzi_pct,
        imballo_items: draft.imballo_items,
        pezzi_pallet: draft.pezzi_pallet,
        allineato: draft.allineato,
        rinfusa: draft.rinfusa,
        rinfusa_ricarico_div_100: draft.rinfusa_ricarico_div_100,
      }
      await updateConfig(accessToken, editingId, patch)
      setConfigs((prev) =>
        prev.map((c) => (c.id === editingId ? { ...c, ...draft } : c)),
      )
      notify('Configurazione aggiornata')
      cancelEdit()
    } catch (e) {
      notify('Errore: ' + String(e))
    }
  }

  const label = (
    id: string,
    items: { id: string; name: string; code?: string }[],
    fallback = '—',
  ) => items.find((x) => x.id === id)?.name ?? fallback
  const capLabel = (id: string) =>
    capacities.find((x) => x.id === id)?.label ?? id

  const numInput = (value: number, onChange: (v: number) => void) => (
    <input
      type="number"
      step={0.01}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className="w-20 rounded-lg border border-slate-300 px-1.5 py-0.5 text-xs focus:border-blue-500 focus:outline-none"
    />
  )

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold text-slate-800">Gestione dati listino</h1>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">{profile?.full_name ?? 'Utente'}</span>
            <Link
              to="/"
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Listino
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {error && <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>}
        {saved && <p className="rounded-lg bg-green-50 p-4 text-sm text-green-700">{saved}</p>}

        <div className="rounded-xl bg-white p-4 shadow">
          <h2 className="text-base font-semibold text-slate-800">Configurazioni listino</h2>
          <p className="mt-1 text-xs text-slate-500">
            {configs.length} combinazioni capacità × materiale × colore. Clicca "Modifica" per
            modificare materie prime, imballo e parametri macchina.
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
                  <th className="px-3 py-2">Capacità</th>
                  <th className="px-3 py-2">Materiale</th>
                  <th className="px-3 py-2">Colore</th>
                  <th className="px-3 py-2">Peso (g)</th>
                  <th className="px-3 py-2">MP costi (€/kg)</th>
                  <th className="px-3 py-2">Pezzi/pallet</th>
                  <th className="px-3 py-2">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {configs.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100">
                    <td className="px-3 py-2">{capLabel(c.capacity_id)}</td>
                    <td className="px-3 py-2">{label(c.material_id, materials)}</td>
                    <td className="px-3 py-2">{label(c.color_id, colors)}</td>
                    <td className="px-3 py-2">{c.peso_disegno_g}</td>
                    <td className="px-3 py-2">{c.mp_costos_kg.join(', ')}</td>
                    <td className="px-3 py-2">{c.pezzi_pallet}</td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => startEdit(c)}
                        className="rounded-lg border border-blue-300 px-2 py-1 text-xs text-blue-700 hover:bg-blue-50"
                      >
                        Modifica
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {editingId && draft && (
          <div className="rounded-xl bg-white p-4 shadow">
          <h2 className="text-base font-semibold text-slate-800">
            Modifica: {capLabel(draft.capacity_id ?? '')} · {label(draft.material_id ?? '', materials)} · {label(draft.color_id ?? '', colors)}
          </h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-600">Peso (g)</label>
                {numInput(draft.peso_disegno_g ?? 0, (v) => setDraft({ ...draft, peso_disegno_g: v }))}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600">Pezzi/pallet</label>
                {numInput(draft.pezzi_pallet ?? 0, (v) => setDraft({ ...draft, pezzi_pallet: v }))}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600">Costi MP (€/kg)</label>
                <div className="mt-1 flex gap-1">
                  {(draft.mp_costos_kg ?? []).map((v, i) =>
                    numInput(v, (nv) => {
                      const a = [...(draft.mp_costos_kg ?? [])]
                      a[i] = nv
                      setDraft({ ...draft, mp_costos_kg: a })
                    }),
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600">% utilizzo MP</label>
                <div className="mt-1 flex gap-1">
                  {(draft.mp_utilizzi_pct ?? []).map((v, i) =>
                    numInput(v, (v2) => {
                      const a = [...(draft.mp_utilizzi_pct ?? [])]
                      a[i] = v2
                      setDraft({ ...draft, mp_utilizzi_pct: a })
                    }),
                  )}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-600">Imballo (€/pezzo)</label>
                <div className="mt-1 space-y-1">
                  {(draft.imballo_items ?? []).map((it: ImballoItem, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={it.name}
                        onChange={(e) => {
                          const a = [...(draft.imballo_items ?? [])]
                          a[i] = { ...it, name: e.target.value }
                          setDraft({ ...draft, imballo_items: a })
                        }}
                        className="w-48 rounded-lg border border-slate-300 px-2 py-1 text-xs"
                      />
                      {numInput(it.costo, (v) => {
                        const a = [...(draft.imballo_items ?? [])]
                        a[i] = { ...it, costo: v }
                        setDraft({ ...draft, imballo_items: a })
                      })}
                    </div>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2 border-t border-slate-200 pt-3">
                <fieldset className="border border-slate-200 p-3">
                  <legend className="px-1 text-xs font-semibold text-slate-500">Allineato</legend>
                  <MachineParamsGrid params={draft.allineato ?? null} onChange={(v) => setDraft({ ...draft, allineato: v })} disabled />
                </fieldset>
                <fieldset className="border border-slate-200 p-3 mt-2">
                  <legend className="px-1 text-xs font-semibold text-slate-500">Rinfusa</legend>
                  <MachineParamsGrid params={draft.rinfusa ?? null} onChange={(v) => setDraft({ ...draft, rinfusa: v })} disabled />
                </fieldset>
                <p className="mt-1 text-xs text-slate-400">
                  I parametri macchina verranno resi modificabili in una prossima release.
                </p>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={cancelEdit}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Annulla
              </button>
              <button
                onClick={saveEdit}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Salva
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function MachineParamsGrid({
  params,
  onChange,
  disabled,
}: {
  params: {
    ore_uomo: number
    costo_rsu: number
    velocita_pz_h: number
    rsu_unit: number
    costo_orario_macchina: number
    costo_orario_rsu: number
    ricarico_costi_ind: number
  } | null
  onChange: (v: any) => void
  disabled?: boolean
}) {
  if (!params) return <p className="text-xs text-slate-400">N/D</p>
  const fields: [keyof typeof params, string][] = [
    ['ore_uomo', 'Ore uomo'],
    ['costo_rsu', 'Costo RSU'],
    ['velocita_pz_h', 'Velocità (pz/h)'],
    ['rsu_unit', 'RSU (unità)'],
    ['costo_orario_macchina', 'Costo orario macchina'],
    ['costo_orario_rsu', 'Costo orario RSU'],
    ['ricarico_costi_ind', 'Ricarico costi ind.'],
  ]
  return (
    <div className="grid grid-cols-3 gap-2">
      {fields.map(([k, lbl]) => (
        <div key={k}>
          <label className="text-xs text-slate-500">{lbl}</label>
          <input
            type="number"
            step={0.01}
            value={params[k] ?? 0}
            readOnly={disabled}
            onChange={(e) => {
              if (disabled) return
              onChange({ ...params, [k]: parseFloat(e.target.value) || 0 })
            }}
            className="mt-0.5 w-full rounded-lg border border-slate-300 px-1.5 py-0.5 text-xs read-only:bg-slate-50"
          />
        </div>
      ))}
    </div>
  )
}
