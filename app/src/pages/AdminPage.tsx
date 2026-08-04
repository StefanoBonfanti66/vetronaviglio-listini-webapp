import { useEffect, useState } from 'react'
import {
  createCapacity,
  createColor,
  createConfig,
  createMaterial,
  deleteCapacity,
  deleteColor,
  deleteConfig,
  deleteMaterial,
  getCapacities,
  getColors,
  getConfigs,
  getMaterials,
  getPriceBrackets,
  updateCapacity,
  updateColor,
  updateConfig,
  updateMaterial,
} from '../lib/api'
import type {
  Capacity,
  Color,
  ImballoItem,
  ListinoConfig,
  MachineParams,
  Material,
  PriceBracket,
} from '../lib/types'
import { useAuth } from '../context/AuthContext'
import CrudManager from '../components/admin/CrudManager'
import BracketsManager from '../components/admin/BracketsManager'

const defaultMachineParams = (): MachineParams => ({
  ore_uomo: 0,
  costo_rsu: 0,
  velocita_pz_h: 0,
  rsu_unit: 0,
  costo_orario_macchina: 0,
  costo_orario_rsu: 0,
  ricarico_costi_ind: 0,
})

const makeEmptyConfig = (): Omit<ListinoConfig, 'id'> => ({
  capacity_id: '',
  material_id: '',
  color_id: '',
  peso_disegno_g: 0,
  mp_costos_kg: [0, 0, 0, 0],
  mp_utilizzi_pct: [0, 0, 0, 0],
  imballo_items: [{ name: '', costo: 0 }],
  pezzi_pallet: 0,
  allineato: defaultMachineParams(),
  rinfusa: defaultMachineParams(),
  rinfusa_ricarico_div_100: false,
})

export default function AdminPage() {
  const { session } = useAuth()
  const accessToken = session?.access_token
  const [materials, setMaterials] = useState<Material[]>([])
  const [colors, setColors] = useState<Color[]>([])
  const [capacities, setCapacities] = useState<Capacity[]>([])
  const [configs, setConfigs] = useState<ListinoConfig[]>([])
  const [brackets, setBrackets] = useState<PriceBracket[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Partial<ListinoConfig>>({})
  const [creating, setCreating] = useState(false)
  const [newConfig, setNewConfig] = useState<Omit<ListinoConfig, 'id'>>(makeEmptyConfig())
  const [filterMaterial, setFilterMaterial] = useState('')
  const [filterColor, setFilterColor] = useState('')
  const [filterCapacity, setFilterCapacity] = useState('')

  useEffect(() => {
    if (!accessToken) return
    Promise.all([
      getMaterials(accessToken),
      getColors(accessToken),
      getCapacities(accessToken),
      getConfigs(accessToken),
      getPriceBrackets(accessToken),
    ])
      .then(([m, c, ca, cfg, br]) => {
        setMaterials(m)
        setColors(c)
        setCapacities(ca)
        setConfigs(cfg)
        setBrackets(br)
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

  const saveNew = async () => {
    if (!accessToken) return
    if (!newConfig.capacity_id || !newConfig.material_id || !newConfig.color_id) {
      notify('Seleziona capacità, materiale e colore')
      return
    }
    try {
      const created = await createConfig(accessToken, newConfig)
      setConfigs((prev) => [...prev, created])
      notify('Configurazione creata')
      setCreating(false)
      setNewConfig(makeEmptyConfig())
    } catch (e) {
      notify('Errore: ' + String(e))
    }
  }

  const confirmDelete = async (cfg: ListinoConfig) => {
    if (!accessToken) return
    const lbl = `${capLabel(cfg.capacity_id)} · ${label(cfg.material_id, materials)} · ${label(cfg.color_id, colors)}`
    if (!window.confirm(`Eliminare la configurazione "${lbl}"?`)) return
    try {
      await deleteConfig(accessToken, cfg.id)
      setConfigs((prev) => prev.filter((x) => x.id !== cfg.id))
      if (editingId === cfg.id) cancelEdit()
      notify('Configurazione eliminata')
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

  const numInput = (key: number, value: number, onChange: (v: number) => void) => (
    <input
      key={key}
      type="number"
      step={0.01}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className="w-16 md:w-20 border border-aluminum/20 bg-white px-1.5 py-1 font-sans text-xs text-onyx focus:border-onyx focus:outline-none"
    />
  )

  const filteredConfigs = configs.filter(
    (c) =>
      (!filterMaterial || c.material_id === filterMaterial) &&
      (!filterColor || c.color_id === filterColor) &&
      (!filterCapacity || c.capacity_id === filterCapacity),
  )

  const filterCls =
    'mt-1 block w-full border border-aluminum/20 bg-white px-3 py-2 font-sans text-sm text-onyx focus:border-onyx focus:outline-none transition-colors'

  const selectCls =
    'mt-1 block w-full border border-aluminum/20 bg-white px-3 py-2 font-sans text-sm text-onyx focus:border-onyx focus:outline-none'

  const formLabel = 'block font-sans text-[10px] uppercase tracking-[0.2em] text-aluminum mb-1'

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      {error && <p className="border border-red-600/20 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {saved && <p className="border border-amber-accent/30 bg-surface p-4 text-sm text-onyx/80">{saved}</p>}

      <div className="bg-white border border-aluminum/10 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              Configurazioni listino
            </h2>
            <p className="mt-1 font-sans text-[13px] text-aluminum">
              {configs.length} combinazioni capacità × materiale × colore. Crea, modifica o
              elimina le configurazioni: l'app è l'unica fonte di dati.
            </p>
          </div>
          <button
            onClick={() => {
              setNewConfig(makeEmptyConfig())
              setCreating(true)
            }}
            className="border border-onyx px-4 py-2 font-sans text-[10px] uppercase tracking-[0.2em] font-medium text-onyx hover:bg-onyx hover:text-bone transition-all duration-300"
          >
            Nuova configurazione
          </button>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block font-sans text-[10px] uppercase tracking-[0.2em] text-aluminum">Materiale</label>
            <select
              value={filterMaterial}
              onChange={(e) => setFilterMaterial(e.target.value)}
              className={filterCls}
            >
              <option value="">Tutti</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-sans text-[10px] uppercase tracking-[0.2em] text-aluminum">Colore</label>
            <select
              value={filterColor}
              onChange={(e) => setFilterColor(e.target.value)}
              className={filterCls}
            >
              <option value="">Tutti</option>
              {colors.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-sans text-[10px] uppercase tracking-[0.2em] text-aluminum">Capacità</label>
            <select
              value={filterCapacity}
              onChange={(e) => setFilterCapacity(e.target.value)}
              className={filterCls}
            >
              <option value="">Tutte</option>
              {capacities.map((ca) => (
                <option key={ca.id} value={ca.id}>{ca.label}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="mt-3 font-sans text-[11px] uppercase tracking-[0.2em] text-aluminum">
          {filteredConfigs.length} di {configs.length} mostrate
          {filteredConfigs.length !== configs.length && (
            <button
              onClick={() => {
                setFilterMaterial('')
                setFilterColor('')
                setFilterCapacity('')
              }}
              className="ml-3 text-amber-accent hover:text-onyx transition-colors"
            >
              Azzera filtri
            </button>
          )}
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full font-sans text-xs">
            <thead>
              <tr className="border-b border-aluminum/10 text-left font-sans text-[10px] uppercase tracking-[0.15em] text-aluminum">
                <th className="px-3 py-2 font-medium">Capacità</th>
                <th className="px-3 py-2 font-medium">Materiale</th>
                <th className="px-3 py-2 font-medium">Colore</th>
                <th className="hidden px-3 py-2 font-medium md:table-cell">Peso (g)</th>
                <th className="hidden px-3 py-2 font-medium md:table-cell">MP costi (€/kg)</th>
                <th className="hidden px-3 py-2 font-medium md:table-cell">Pezzi/pallet</th>
                <th className="px-3 py-2 font-medium">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {filteredConfigs.map((c) => (
                <tr key={c.id} className="border-b border-aluminum/10">
                  <td className="px-3 py-2 text-onyx/80">{capLabel(c.capacity_id)}</td>
                  <td className="px-3 py-2 text-onyx/80">{label(c.material_id, materials)}</td>
                  <td className="px-3 py-2 text-onyx/80">{label(c.color_id, colors)}</td>
                  <td className="hidden px-3 py-2 text-onyx/60 md:table-cell">{c.peso_disegno_g}</td>
                  <td className="hidden px-3 py-2 text-onyx/60 md:table-cell">{c.mp_costos_kg.join(', ')}</td>
                  <td className="hidden px-3 py-2 text-onyx/60 md:table-cell">{c.pezzi_pallet}</td>
                  <td className="px-3 py-2">
                    <span className="flex gap-2">
                      <button
                        onClick={() => startEdit(c)}
                        className="border border-onyx px-3 py-1 font-sans text-[10px] uppercase tracking-[0.2em] font-medium text-onyx hover:bg-onyx hover:text-bone transition-all duration-300"
                      >
                        Modifica
                      </button>
                      <button
                        onClick={() => confirmDelete(c)}
                        className="border border-red-600/30 px-3 py-1 font-sans text-[10px] uppercase tracking-[0.2em] text-red-600 hover:bg-red-600 hover:text-bone transition-all"
                      >
                        Elimina
                      </button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {creating && (
        <div className="bg-white border border-aluminum/10 p-6">
          <h2 className="font-display text-xl font-semibold tracking-tight">Nuova configurazione</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <label className={formLabel}>Capacità</label>
              <select
                value={newConfig.capacity_id}
                onChange={(e) => setNewConfig({ ...newConfig, capacity_id: e.target.value })}
                className={selectCls}
              >
                <option value="">Seleziona…</option>
                {capacities.map((ca) => (
                  <option key={ca.id} value={ca.id}>{ca.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={formLabel}>Materiale</label>
              <select
                value={newConfig.material_id}
                onChange={(e) => setNewConfig({ ...newConfig, material_id: e.target.value })}
                className={selectCls}
              >
                <option value="">Seleziona…</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={formLabel}>Colore</label>
              <select
                value={newConfig.color_id}
                onChange={(e) => setNewConfig({ ...newConfig, color_id: e.target.value })}
                className={selectCls}
              >
                <option value="">Seleziona…</option>
                {colors.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className={formLabel}>Peso (g)</label>
              {numInput(0, newConfig.peso_disegno_g, (v) => setNewConfig({ ...newConfig, peso_disegno_g: v }))}
            </div>
            <div>
              <label className={formLabel}>Pezzi/pallet</label>
              {numInput(1, newConfig.pezzi_pallet, (v) => setNewConfig({ ...newConfig, pezzi_pallet: v }))}
            </div>

            <div>
              <label className={formLabel}>Costi MP (€/kg)</label>
              <div className="flex flex-wrap gap-1">
                {newConfig.mp_costos_kg.map((v, i) =>
                  numInput(i + 1, v, (nv) => {
                    const a = [...newConfig.mp_costos_kg]
                    a[i] = nv
                    setNewConfig({ ...newConfig, mp_costos_kg: a })
                  }),
                )}
              </div>
            </div>
            <div>
              <label className={formLabel}>% utilizzo MP</label>
              <div className="flex flex-wrap gap-1">
                {newConfig.mp_utilizzi_pct.map((v, i) =>
                  numInput(i + 1, v, (v2) => {
                    const a = [...newConfig.mp_utilizzi_pct]
                    a[i] = v2
                    setNewConfig({ ...newConfig, mp_utilizzi_pct: a })
                  }),
                )}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className={formLabel}>Imballo (€/pezzo)</label>
              <div className="space-y-1">
                {newConfig.imballo_items.map((it: ImballoItem, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={it.name}
                      onChange={(e) => {
                        const a = [...newConfig.imballo_items]
                        a[i] = { ...it, name: e.target.value }
                        setNewConfig({ ...newConfig, imballo_items: a })
                      }}
                      className="w-40 md:w-48 border border-aluminum/20 bg-white px-2 py-1 font-sans text-xs text-onyx focus:border-onyx focus:outline-none"
                    />
                    {numInput(i + 100, it.costo, (v) => {
                      const a = [...newConfig.imballo_items]
                      a[i] = { ...it, costo: v }
                      setNewConfig({ ...newConfig, imballo_items: a })
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="sm:col-span-2 border-t border-aluminum/10 pt-4">
              <fieldset className="border border-aluminum/20 p-3">
                <legend className="px-1 font-sans text-[10px] uppercase tracking-[0.2em] font-medium text-aluminum">Allineato</legend>
                <MachineParamsGrid params={newConfig.allineato} onChange={(v) => setNewConfig({ ...newConfig, allineato: v })} />
              </fieldset>
              <fieldset className="border border-aluminum/20 p-3 mt-2">
                <legend className="px-1 font-sans text-[10px] uppercase tracking-[0.2em] font-medium text-aluminum">Rinfusa</legend>
                <MachineParamsGrid params={newConfig.rinfusa} onChange={(v) => setNewConfig({ ...newConfig, rinfusa: v })} />
              </fieldset>
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={() => setCreating(false)}
              className="border border-aluminum/30 px-4 py-2 font-sans text-[10px] uppercase tracking-[0.2em] font-medium text-aluminum hover:border-onyx hover:text-onyx transition-all"
            >
              Annulla
            </button>
            <button
              onClick={saveNew}
              className="bg-onyx text-bone px-4 py-2 font-sans text-[10px] uppercase tracking-[0.2em] font-medium hover:bg-aluminum transition-all"
            >
              Crea
            </button>
          </div>
        </div>
      )}

      {editingId && draft && (
        <div className="bg-white border border-aluminum/10 p-6">
          <h2 className="font-display text-xl font-semibold tracking-tight">
            Modifica: {capLabel(draft.capacity_id ?? '')} · {label(draft.material_id ?? '', materials)} · {label(draft.color_id ?? '', colors)}
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className={formLabel}>Peso (g)</label>
              {numInput(0, draft.peso_disegno_g ?? 0, (v) => setDraft({ ...draft, peso_disegno_g: v }))}
            </div>
            <div>
              <label className={formLabel}>Pezzi/pallet</label>
              {numInput(1, draft.pezzi_pallet ?? 0, (v) => setDraft({ ...draft, pezzi_pallet: v }))}
            </div>

            <div>
              <label className={formLabel}>Costi MP (€/kg)</label>
              <div className="flex flex-wrap gap-1">
                {(draft.mp_costos_kg ?? []).map((v, i) =>
                  numInput(i + 1, v, (nv) => {
                    const a = [...(draft.mp_costos_kg ?? [])]
                    a[i] = nv
                    setDraft({ ...draft, mp_costos_kg: a })
                  }),
                )}
              </div>
            </div>
            <div>
              <label className={formLabel}>% utilizzo MP</label>
              <div className="flex flex-wrap gap-1">
                {(draft.mp_utilizzi_pct ?? []).map((v, i) =>
                  numInput(i + 1, v, (v2) => {
                    const a = [...(draft.mp_utilizzi_pct ?? [])]
                    a[i] = v2
                    setDraft({ ...draft, mp_utilizzi_pct: a })
                  }),
                )}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className={formLabel}>Imballo (€/pezzo)</label>
              <div className="space-y-1">
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
                      className="w-40 md:w-48 border border-aluminum/20 bg-white px-2 py-1 font-sans text-xs text-onyx focus:border-onyx focus:outline-none"
                    />
                    {numInput(i + 100, it.costo, (v) => {
                      const a = [...(draft.imballo_items ?? [])]
                      a[i] = { ...it, costo: v }
                      setDraft({ ...draft, imballo_items: a })
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="sm:col-span-2 border-t border-aluminum/10 pt-4">
              <fieldset className="border border-aluminum/20 p-3">
                <legend className="px-1 font-sans text-[10px] uppercase tracking-[0.2em] font-medium text-aluminum">Allineato</legend>
                <MachineParamsGrid params={draft.allineato ?? null} onChange={(v) => setDraft({ ...draft, allineato: v })} />
              </fieldset>
              <fieldset className="border border-aluminum/20 p-3 mt-2">
                <legend className="px-1 font-sans text-[10px] uppercase tracking-[0.2em] font-medium text-aluminum">Rinfusa</legend>
                <MachineParamsGrid params={draft.rinfusa ?? null} onChange={(v) => setDraft({ ...draft, rinfusa: v })} />
              </fieldset>
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={cancelEdit}
              className="border border-aluminum/30 px-4 py-2 font-sans text-[10px] uppercase tracking-[0.2em] font-medium text-aluminum hover:border-onyx hover:text-onyx transition-all"
            >
              Annulla
            </button>
            <button
              onClick={saveEdit}
              className="bg-onyx text-bone px-4 py-2 font-sans text-[10px] uppercase tracking-[0.2em] font-medium hover:bg-aluminum transition-all"
            >
              Salva
            </button>
          </div>
        </div>
      )}

      <CrudManager
        title="Materiali"
        description="Materie prime disponibili. Disattiva un materiale per nasconderlo nella ricerca."
        cols={[
          { key: 'code', label: 'Codice' },
          { key: 'name', label: 'Nome' },
          { key: 'sort_order', label: 'Ordine' },
          { key: 'enabled', label: 'Attivo', render: (r) => (r.enabled ? 'Sì' : 'No') },
        ]}
        rows={materials}
        setRows={setMaterials}
        makeEmpty={() => ({ code: '', name: '', sort_order: 0, enabled: true })}
        create={createMaterial}
        update={updateMaterial}
        remove={deleteMaterial}
      />

      <CrudManager
        title="Colori"
        description="Colori disponibili. Disattiva un colore per nasconderlo nella ricerca."
        cols={[
          { key: 'code', label: 'Codice' },
          { key: 'name', label: 'Nome' },
          { key: 'sort_order', label: 'Ordine' },
          { key: 'enabled', label: 'Attivo', render: (r) => (r.enabled ? 'Sì' : 'No') },
        ]}
        rows={colors}
        setRows={setColors}
        makeEmpty={() => ({ code: '', name: '', sort_order: 0, enabled: true })}
        create={createColor}
        update={updateColor}
        remove={deleteColor}
      />

      <CrudManager
        title="Capacità"
        description="Capacità disponibili (ml). Disattiva una capacità per nasconderla nella ricerca."
        cols={[
          { key: 'label', label: 'Capacità' },
          { key: 'peso_disegno_g', label: 'Peso (g)' },
          { key: 'sort_order', label: 'Ordine' },
          { key: 'enabled', label: 'Attivo', render: (r) => (r.enabled ? 'Sì' : 'No') },
        ]}
        rows={capacities}
        setRows={setCapacities}
        makeEmpty={() => ({ label: '', peso_disegno_g: 0, sort_order: 0, enabled: true })}
        create={createCapacity}
        update={updateCapacity}
        remove={deleteCapacity}
      />

      <BracketsManager brackets={brackets} setBrackets={setBrackets} />
    </div>
  )
}

function MachineParamsGrid({
  params,
  onChange,
}: {
  params: MachineParams | null
  onChange: (v: MachineParams) => void
}) {
  const p: MachineParams = params ?? {
    ore_uomo: 0,
    costo_rsu: 0,
    velocita_pz_h: 0,
    rsu_unit: 0,
    costo_orario_macchina: 0,
    costo_orario_rsu: 0,
    ricarico_costi_ind: 0,
  }
  const fields: [keyof MachineParams, string][] = [
    ['ore_uomo', 'Ore uomo'],
    ['costo_rsu', 'Costo RSU'],
    ['velocita_pz_h', 'Velocità (pz/h)'],
    ['rsu_unit', 'RSU (unità)'],
    ['costo_orario_macchina', 'Costo orario macchina'],
    ['costo_orario_rsu', 'Costo orario RSU'],
    ['ricarico_costi_ind', 'Ricarico costi ind.'],
  ]
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
      {fields.map(([k, lbl]) => (
        <div key={k}>
          <label className="font-sans text-[10px] text-aluminum">{lbl}</label>
          <input
            type="number"
            step={0.01}
            value={p[k] ?? 0}
            onChange={(e) => {
              onChange({ ...p, [k]: parseFloat(e.target.value) || 0 })
            }}
            className="mt-0.5 w-full border border-aluminum/20 bg-white px-1.5 py-1 font-sans text-xs text-onyx focus:border-onyx focus:outline-none"
          />
        </div>
      ))}
    </div>
  )
}
