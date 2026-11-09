import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
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
  getImballiFissi,
  getMaterials,
  getPriceBrackets,
  getPriceChangeLog,
  getProfiles,
  saveImballoFisso,
  updateCapacity,
  updateColor,
  updateConfig,
  updateMaterial,
  createPriceChangeLog,
} from '../lib/api'
import type {
  Capacity,
  Color,
  FasciaImballo,
  ImballoFisso,
  ListinoConfig,
  Material,
  ModalitaImballo,
  PriceBracket,
  PriceChangeLog,
  Profile,
} from '../lib/types'
import { useAuth } from '../context/AuthContext'
import CrudManager from '../components/admin/CrudManager'
import BracketsManager from '../components/admin/BracketsManager'
import ImballiManager from '../components/admin/ImballiManager'
import { findImballoFisso } from '../lib/imballi'
import {
  applyBaseCost,
  applyMasterCost,
  prefillFromAnagrafiche,
} from '../lib/costs'

const makeEmptyConfig = (): Omit<ListinoConfig, 'id'> => ({
  capacity_id: '',
  material_id: '',
  color_id: '',
  peso_disegno_g: 0,
  mp_costos_kg: [0, 0, 0, 0],
  mp_utilizzi_pct: [0, 0, 0, 0],
  imballo_items: [],
  pezzi_pallet: 0,
  // Fase 1 - Attrezzaggio
  ore_uomo: 6,
  costo_rsu: 0,
  // Fase 2 - Produzione/Ciclo
  velocita_pz_h: 0,
  rsu_unit: 0,
  rsu_unit_rinfusa: 0,
  costo_orario_macchina: 0,
  costo_orario_rsu: 0,
  ricarico_costi_ind: 0,
  rinfusa_ricarico_div_100: false,
  master_color_costo_kg: null,
})

export default function AdminPage() {
  const { session } = useAuth()
  const accessToken = session?.access_token
  const [materials, setMaterials] = useState<Material[]>([])
  const [colors, setColors] = useState<Color[]>([])
  const [capacities, setCapacities] = useState<Capacity[]>([])
  const [configs, setConfigs] = useState<ListinoConfig[]>([])
  const [brackets, setBrackets] = useState<PriceBracket[]>([])
  const [imballi, setImballi] = useState<ImballoFisso[]>([])
  const [priceChangeLog, setPriceChangeLog] = useState<PriceChangeLog[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const profileMap = useMemo(() => {
    const m: Record<string, string> = {}
    for (const p of profiles) {
      if (p.id) m[p.id] = p.full_name ?? p.id
    }
    return m
  }, [profiles])
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Partial<ListinoConfig>>({})
  const [creating, setCreating] = useState(false)
  const [newConfig, setNewConfig] = useState<Omit<ListinoConfig, 'id'>>(makeEmptyConfig())
  const [filterMaterial, setFilterMaterial] = useState('')
  const [filterColor, setFilterColor] = useState('')
  const [filterCapacity, setFilterCapacity] = useState('')
  const [activeTab, setActiveTab] = useState<'attrezzaggio' | 'ciclo' | 'imballo'>('attrezzaggio')

  useEffect(() => {
    if (!accessToken) return
    Promise.all([
      getMaterials(accessToken),
      getColors(accessToken),
      getCapacities(accessToken),
      getConfigs(accessToken),
      getPriceBrackets(accessToken),
      getImballiFissi(accessToken),
      getPriceChangeLog(accessToken),
      getProfiles(accessToken),
    ])
      .then(([m, c, ca, cfg, br, im, pcl, pr]) => {
        setMaterials(m)
        setColors(c)
        setCapacities(ca)
        setConfigs(cfg)
        setBrackets(br)
        setImballi(im)
        setPriceChangeLog(pcl)
        setProfiles(pr)
      })
      .catch((e) => setError(String(e)))
  }, [accessToken])

  const notify = (msg: string) => {
    setSaved(msg)
    setTimeout(() => setSaved(null), 3000)
  }

  // Restituisce true se l'ultimo aggiornamento del PREZZO risale a oltre 30 giorni fa
  // (o se la data non è nota): usato per evidenziare i campi in rosso.
  // Criterio: prezzo_aggiornato_at null -> stale; > 30 giorni -> stale; altrimenti aggiornato.
  const isStale = (prezzoAggiornatoAt: string | null | undefined): boolean => {
    if (!prezzoAggiornatoAt) return true
    const days = (Date.now() - new Date(prezzoAggiornatoAt).getTime()) / (1000 * 60 * 60 * 24)
    return days > 30
  }

  // Propaga il nuovo costo del materiale a tutti i listini che lo usano.
  const propagateMaterialCost = async (
    token: string,
    materialId: string,
    costo: number | null,
  ) => {
    if (costo === null) return
    const affected = configs.filter((c) => c.material_id === materialId)
    if (affected.length === 0) return
    const updated = await Promise.all(
      affected.map((c) =>
        updateConfig(token, c.id, {
          mp_costos_kg: applyBaseCost(c.mp_costos_kg, costo),
        }),
      ),
    )
    setConfigs((prev) => prev.map((c) => updated.find((u) => u.id === c.id) ?? c))
    notify(`Costo aggiornato su ${affected.length} listini`)
  }

  // Propaga il nuovo costo master del colore a tutti i listini che lo usano.
  const propagateColorCost = async (
    token: string,
    colorId: string,
    costo: number | null,
  ) => {
    if (costo === null) return
    const affected = configs.filter((c) => c.color_id === colorId)
    if (affected.length === 0) return
    const updated = await Promise.all(
      affected.map((c) =>
        updateConfig(token, c.id, {
          mp_costos_kg: applyMasterCost(c.mp_costos_kg, costo),
          master_color_costo_kg: costo,
        }),
      ),
    )
    setConfigs((prev) => prev.map((c) => updated.find((u) => u.id === c.id) ?? c))
    notify(`Costo master aggiornato su ${affected.length} listini`)
  }

  // Registra una variazione di prezzo nell'audit trail.
  const logPriceChange = async (
    token: string,
    tableName: 'materials' | 'colors',
    recordId: string,
    fieldChanged: 'costo_kg' | 'master_color_costo_kg',
    oldValue: number | null,
    newValue: number | null,
  ) => {
    try {
      await createPriceChangeLog(token, {
        table_name: tableName,
        record_id: recordId,
        field_changed: fieldChanged,
        old_value: oldValue,
        new_value: newValue,
        changed_by: session?.user?.id ?? null,
      })
      // Ricarica il log per mostrare la nuova riga.
      const updated = await getPriceChangeLog(token)
      setPriceChangeLog(updated)
    } catch {
      // Il log non deve bloccare l'operazione principale se il fallback fallisce.
    }
  }

  const saveMaterial = async (token: string, id: string, patch: Partial<Material>): Promise<Material> => {
    const previous = materials.find((m) => m.id === id)
    const oldCost = previous?.costo_kg ?? null
    const now = new Date().toISOString()
    const updated = await updateMaterial(token, id, {
      ...patch,
      updated_at: now,
      updated_by: session?.user?.id ?? null,
      ...(patch.costo_kg !== undefined && patch.costo_kg !== oldCost
        ? { prezzo_aggiornato_at: now, prezzo_aggiornato_da: session?.user?.id ?? null }
        : {}),
    })
    const nextCost = updated.costo_kg ?? null
    if (nextCost !== oldCost) {
      await propagateMaterialCost(token, id, nextCost)
      await logPriceChange(token, 'materials', id, 'costo_kg', oldCost, nextCost)
    }
    return updated
  }

  const saveColor = async (token: string, id: string, patch: Partial<Color>): Promise<Color> => {
    const previous = colors.find((c) => c.id === id)
    const oldCost = previous?.master_color_costo_kg ?? null
    const now = new Date().toISOString()
    const updated = await updateColor(token, id, {
      ...patch,
      updated_at: now,
      updated_by: session?.user?.id ?? null,
      ...(patch.master_color_costo_kg !== undefined && patch.master_color_costo_kg !== oldCost
        ? { prezzo_aggiornato_at: now, prezzo_aggiornato_da: session?.user?.id ?? null }
        : {}),
    })
    const nextCost = updated.master_color_costo_kg ?? null
    if (nextCost !== oldCost) {
      await propagateColorCost(token, id, nextCost)
      await logPriceChange(token, 'colors', id, 'master_color_costo_kg', oldCost, nextCost)
    }
    return updated
  }

  const saveImballo = async (
    modalita: ModalitaImballo,
    fascia: FasciaImballo,
    value: number | null,
  ) => {
    if (!accessToken) return
    const existing = findImballoFisso(imballi, modalita, fascia)
    const saved = await saveImballoFisso(accessToken, existing, modalita, fascia, value)
    setImballi((prev) => {
      const without = prev.filter(
        (r) => !(r.modalita === modalita && r.fascia === fascia),
      )
      return [...without, saved]
    })
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
        ore_uomo: draft.ore_uomo,
        costo_rsu: draft.costo_rsu,
        velocita_pz_h: draft.velocita_pz_h,
        rsu_unit: draft.rsu_unit,
        costo_orario_macchina: draft.costo_orario_macchina,
        costo_orario_rsu: draft.costo_orario_rsu,
        ricarico_costi_ind: draft.ricarico_costi_ind,
        rinfusa_ricarico_div_100: draft.rinfusa_ricarico_div_100,
        master_color_costo_kg: draft.master_color_costo_kg ?? null,
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
      <Link
        to="/"
        className="inline-block mb-4 font-sans text-[11px] uppercase tracking-[0.2em] text-amber-accent hover:text-onyx transition-colors"
      >
        ← Torna al listino
      </Link>
      {error && <p className="border border-red-600/20 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {saved && <p className="border border-amber-accent/30 bg-surface p-4 text-sm text-onyx/80">{saved}</p>}
      {materials.some((m) => isStale((m as Material).prezzo_aggiornato_at)) && (
        <div className="border border-red-600/30 bg-red-50 p-4 rounded mb-4">
          <p className="font-sans text-sm text-red-700 font-semibold">
            ATTENZIONE: aggiorna i prezzi dei materiali. Uno o più prezzi non risultano aggiornati da oltre un mese.
          </p>
        </div>
      )}

            <CrudManager
        title="Materiali"
        description="Materie prime disponibili. Il costo €/kg si propaga a tutti i listini del materiale. Disattiva un materiale per nasconderlo nella ricerca."
        cols={[
          { key: 'code', label: 'Codice' },
          { key: 'name', label: 'Nome' },
          { key: 'costo_kg', label: 'Costo MP (€/kg)', inputType: 'decimal' },
          { key: 'sort_order', label: 'Ordine' },
          { key: 'enabled', label: 'Attivo', render: (r) => (r.enabled ? 'Sì' : 'No') },
          { key: 'prezzo_aggiornato_at', label: 'Ultima variazione prezzo', render: (r) => (r.prezzo_aggiornato_at ? new Date(r.prezzo_aggiornato_at).toLocaleDateString('it-IT') : '—') },
          {
            key: 'updated_by',
            label: 'Modificato da',
            render: (r) => {
              const id = (r as Material).updated_by ?? '';
              const name = profileMap[id] ?? '';
              return name || (id ? id.slice(0, 8) : '—');
            },
          },
        ]}
        rows={materials}
        setRows={setMaterials}
        makeEmpty={() => ({ code: '', name: '', sort_order: 0, enabled: true, costo_kg: null, prezzo_aggiornato_at: null })}
        create={createMaterial}
        update={saveMaterial}
        remove={deleteMaterial}
        rowIsStale={(r) => isStale((r as Material).prezzo_aggiornato_at)}
      />

      <CrudManager
        title="Colori"
        description="Colori disponibili. Il costo master €/kg si propaga a tutti i listini del colore. Disattiva un colore per nasconderlo nella ricerca."
        cols={[
          { key: 'code', label: 'Codice' },
          { key: 'name', label: 'Nome' },
          { key: 'master_color_costo_kg', label: 'Costo master (€/kg)', inputType: 'decimal' },
          { key: 'sort_order', label: 'Ordine' },
          { key: 'enabled', label: 'Attivo', render: (r) => (r.enabled ? 'Sì' : 'No') },
          { key: 'prezzo_aggiornato_at', label: 'Ultima variazione prezzo', render: (r) => (r.prezzo_aggiornato_at ? new Date(r.prezzo_aggiornato_at).toLocaleDateString('it-IT') : '—') },
          {
            key: 'updated_by',
            label: 'Modificato da',
            render: (r) => {
              const id = (r as Color).updated_by ?? '';
              const name = profileMap[id] ?? '';
              return name || (id ? id.slice(0, 8) : '—');
            },
          },
        ]}
        rows={colors}
        setRows={setColors}
        makeEmpty={() => ({ code: '', name: '', sort_order: 0, enabled: true, master_color_costo_kg: null, prezzo_aggiornato_at: null })}
        create={createColor}
        update={saveColor}
        remove={deleteColor}
        rowIsStale={(r) => isStale((r as Color).prezzo_aggiornato_at)}
      />

      <ImballiManager rows={imballi} onSave={saveImballo} />

      <BracketsManager brackets={brackets} setBrackets={setBrackets} />

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
                onChange={(e) => {
                  const materialId = e.target.value
                  const material = materials.find((m) => m.id === materialId) ?? null
                  const color = colors.find((c) => c.id === newConfig.color_id) ?? null
                  const prefill = prefillFromAnagrafiche(
                    material,
                    color,
                    newConfig.mp_costos_kg,
                    newConfig.mp_utilizzi_pct,
                  )
                  setNewConfig({
                    ...newConfig,
                    material_id: materialId,
                    ...prefill,
                  })
                }}
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
                onChange={(e) => {
                  const colorId = e.target.value
                  const material = materials.find((m) => m.id === newConfig.material_id) ?? null
                  const color = colors.find((c) => c.id === colorId) ?? null
                  const prefill = prefillFromAnagrafiche(
                    material,
                    color,
                    newConfig.mp_costos_kg,
                    newConfig.mp_utilizzi_pct,
                  )
                  setNewConfig({
                    ...newConfig,
                    color_id: colorId,
                    ...prefill,
                  })
                }}
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

            <div>
              <label className={formLabel}>Costo master color (€/kg) — vuoto = legacy</label>
              <input
                type="number"
                step={0.01}
                value={newConfig.master_color_costo_kg ?? ''}
                onChange={(e) => {
                  const raw = e.target.value
                  setNewConfig({
                    ...newConfig,
                    master_color_costo_kg: raw === '' ? null : parseFloat(raw) || 0,
                  })
                }}
                placeholder="legacy"
                className="w-24 md:w-28 border border-aluminum/20 bg-white px-1.5 py-1 font-sans text-xs text-onyx focus:border-onyx focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2 border-t border-aluminum/10 pt-4">
              <div className="flex gap-1 mb-3">
                <button
                  onClick={() => setActiveTab('attrezzaggio')}
                  className={`px-3 py-1 text-xs font-sans font-medium border rounded ${activeTab === 'attrezzaggio' ? 'bg-onyx text-bone' : 'border-aluminum/20 text-aluminum hover:bg-aluminum/5'}`}
                >
                  Fase 1 · Attrezzaggio
                </button>
                <button
                  onClick={() => setActiveTab('ciclo')}
                  className={`px-3 py-1 text-xs font-sans font-medium border rounded ${activeTab === 'ciclo' ? 'bg-onyx text-bone' : 'border-aluminum/20 text-aluminum hover:bg-aluminum/5'}`}
                >
                  Fase 2 · Ciclo produttivo
                </button>
                <button
                  onClick={() => setActiveTab('imballo')}
                  className={`px-3 py-1 text-xs font-sans font-medium border rounded ${activeTab === 'imballo' ? 'bg-onyx text-bone' : 'border-aluminum/20 text-aluminum hover:bg-aluminum/5'}`}
                >
                  Fase 3 · Imballo
                </button>
              </div>

              {activeTab === 'attrezzaggio' && (
                <fieldset className="border border-aluminum/20 p-3">
                  <legend className="px-1 font-sans text-[10px] uppercase tracking-[0.2em] font-medium text-aluminum">Fase 1 — Attrezzaggio (una sola volta)</legend>
                  <MachineParamsGrid
                    params={newConfig}
                    fields={[
                      ['ore_uomo', 'Ore uomo attrezzaggio'],
                      ['costo_rsu', 'Costo ora uomo attrezzaggio'],
                    ]}
                    onChange={(v) => setNewConfig({ ...newConfig, ...v })}
                  />
                </fieldset>
              )}
              {activeTab === 'ciclo' && (
                <fieldset className="border border-aluminum/20 p-3">
                  <legend className="px-1 font-sans text-[10px] uppercase tracking-[0.2em] font-medium text-aluminum">Fase 2 — Ciclo produttivo</legend>
                  <MachineParamsGrid
                    params={newConfig}
                    fields={[
                      ['velocita_pz_h', 'Velocità (pz/h)'],
                      ['costo_orario_rsu', 'Costo orario RSU'],
                      ['costo_orario_macchina', 'Costo orario macchina'],
                      ['ricarico_costi_ind', 'Ricarico costi ind.'],
                    ]}
                    onChange={(v) => setNewConfig({ ...newConfig, ...v })}
                  />
                </fieldset>
              )}
              {activeTab === 'imballo' && (
                <div className="space-y-1">
                  <fieldset className="border border-aluminum/20 p-3 mt-2">
                    <div className="px-1 font-sans text-[10px] uppercase tracking-[0.2em] font-medium text-aluminum">IMBALLO</div>
                  <MachineParamsGrid
                    params={newConfig}
                    fields={[
                      ['rsu_unit', 'RSU unità imballo allineato (0,5)'],
                      ['rsu_unit_rinfusa', 'RSU unità imballo rinfusa (0,25)'],
                    ]}
                    onChange={(v) => setNewConfig({ ...newConfig, ...v })}
                  />
                  </fieldset>
                </div>
              )}
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

            <div>
              <label className={formLabel}>Costo master color (€/kg) — vuoto = legacy</label>
              <input
                type="number"
                step={0.01}
                value={draft.master_color_costo_kg ?? ''}
                onChange={(e) => {
                  const raw = e.target.value
                  setDraft({
                    ...draft,
                    master_color_costo_kg: raw === '' ? null : parseFloat(raw) || 0,
                  })
                }}
                placeholder="legacy"
                className="w-24 md:w-28 border border-aluminum/20 bg-white px-1.5 py-1 font-sans text-xs text-onyx focus:border-onyx focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2 border-t border-aluminum/10 pt-4">
              <div className="flex gap-1 mb-3">
                <button
                  onClick={() => setActiveTab('attrezzaggio')}
                  className={`px-3 py-1 text-xs font-sans font-medium border rounded ${activeTab === 'attrezzaggio' ? 'bg-onyx text-bone' : 'border-aluminum/20 text-aluminum hover:bg-aluminum/5'}`}
                >
                  Fase 1 · Attrezzaggio
                </button>
                <button
                  onClick={() => setActiveTab('ciclo')}
                  className={`px-3 py-1 text-xs font-sans font-medium border rounded ${activeTab === 'ciclo' ? 'bg-onyx text-bone' : 'border-aluminum/20 text-aluminum hover:bg-aluminum/5'}`}
                >
                  Fase 2 · Ciclo produttivo
                </button>
                <button
                  onClick={() => setActiveTab('imballo')}
                  className={`px-3 py-1 text-xs font-sans font-medium border rounded ${activeTab === 'imballo' ? 'bg-onyx text-bone' : 'border-aluminum/20 text-aluminum hover:bg-aluminum/5'}`}
                >
                  Fase 3 · Imballo
                </button>
              </div>

              {activeTab === 'attrezzaggio' && (
                <fieldset className="border border-aluminum/20 p-3">
                  <legend className="px-1 font-sans text-[10px] uppercase tracking-[0.2em] font-medium text-aluminum">Fase 1 — Attrezzaggio (una sola volta)</legend>
                  <MachineParamsGrid
                    params={draft}
                    fields={[
                      ['ore_uomo', 'Ore uomo attrezzaggio'],
                      ['costo_rsu', 'Costo ora uomo attrezzaggio'],
                    ]}
                    onChange={(v) => setDraft({ ...draft, ...v })}
                  />
                </fieldset>
              )}
              {activeTab === 'ciclo' && (
                <fieldset className="border border-aluminum/20 p-3">
                  <legend className="px-1 font-sans text-[10px] uppercase tracking-[0.2em] font-medium text-aluminum">Fase 2 — Ciclo produttivo</legend>
                  <MachineParamsGrid
                    params={draft}
                    fields={[
                      ['velocita_pz_h', 'Velocità (pz/h)'],
                      ['costo_orario_rsu', 'Costo orario RSU'],
                      ['costo_orario_macchina', 'Costo orario macchina'],
                      ['ricarico_costi_ind', 'Ricarico costi ind.'],
                    ]}
                    onChange={(v) => setDraft({ ...draft, ...v })}
                  />
                </fieldset>
              )}
              {activeTab === 'imballo' && (
                <div className="space-y-1">
                  <fieldset className="border border-aluminum/20 p-3 mt-2">
                    <div className="px-1 font-sans text-[10px] uppercase tracking-[0.2em] font-medium text-aluminum">IMBALLO</div>
                  <MachineParamsGrid
                    params={draft}
                    fields={[
                      ['rsu_unit', 'RSU unità imballo allineato (0,5)'],
                      ['rsu_unit_rinfusa', 'RSU unità imballo rinfusa (0,25)'],
                    ]}
                    onChange={(v) => setDraft({ ...draft, ...v })}
                  />
                  </fieldset>
                </div>
              )}
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

      {priceChangeLog.length > 0 && (
        <div className="mt-8 bg-white border border-aluminum/10 p-6">
          <h2 className="font-display text-xl font-semibold tracking-tight mb-4">
            Log Variazioni Prezzi
          </h2>
          <p className="mt-1 font-sans text-[12px] text-aluminum mb-4">
            Storico delle modifiche a costo MP (materiali) e costo master (colori).
            Le righe con variazioni da oltre 30 giorni sono evidenziate in rosso.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full font-sans text-xs">
              <thead>
                <tr className="border-b border-aluminum/10 text-left font-sans text-[10px] uppercase tracking-[0.15em] text-aluminum">
                  <th className="px-3 py-2 font-medium">Data</th>
                  <th className="px-3 py-2 font-medium">Tabella</th>
                  <th className="px-3 py-2 font-medium">Record</th>
                  <th className="px-3 py-2 font-medium">Campo</th>
                  <th className="px-3 py-2 font-medium">Valore prima</th>
                  <th className="px-3 py-2 font-medium">Valore dopo</th>
                  <th className="px-3 py-2 font-medium">Modificato da</th>
                </tr>
              </thead>
              <tbody>
                {priceChangeLog.map((log) => (
                  <tr key={log.id} className="border-b border-aluminum/10">
                    <td className="px-3 py-2 text-onyx/80">
                      {new Date(log.changed_at).toLocaleString('it-IT')}
                    </td>
                    <td className="px-3 py-2 text-onyx/80">
                      {log.table_name === 'materials' ? 'Materiali' : 'Colori'}
                    </td>
                    <td className="px-3 py-2 text-onyx/80">{log.record_id}</td>
                    <td className="px-3 py-2 text-onyx/80">
                      {log.field_changed === 'costo_kg'
                        ? 'Costo MP (€/kg)'
                        : 'Costo master (€/kg)'}
                    </td>
                    <td className="px-3 py-2 text-onyx/80">
                      {log.old_value !== null ? log.old_value.toFixed(3) : '—'}
                    </td>
                    <td className="px-3 py-2 text-onyx/80">
                      {log.new_value !== null ? log.new_value.toFixed(3) : '—'}
                    </td>
                    <td className="px-3 py-2 text-onyx/80">
                      {(() => {
                        const id = log.changed_by ?? '';
                        const name = profileMap[id] ?? '';
                        return name || (id ? id.slice(0, 8) : '—');
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!priceChangeLog || priceChangeLog.length === 0 && (
        <div className="mt-8 bg-white border border-aluminum/10 p-6">
          <h2 className="font-display text-xl font-semibold tracking-tight mb-4">
            Log Variazioni Prezzi
          </h2>
          <p className="font-sans text-[12px] text-aluminum">
            Nessuna variazione prezzi registrata.
          </p>
        </div>
      )}

      <div className="mt-12 bg-white border border-aluminum/10 p-6">
        <h2 className="font-display text-xl font-semibold tracking-tight mb-4">
          Legenda calcolo costi
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-aluminum/10 p-4 rounded">
            <h3 className="font-sans text-[11px] uppercase tracking-[0.2em] text-aluminum mb-3">
              Materie prime
            </h3>
            <p className="font-sans text-[11px] text-aluminum leading-relaxed">
              Costo MP pesato = Σ (costo €/kg × % utilizzo / 100) per ogni
              materiale della configurazione. Valori di base configurabili
              in anagrafica materiali.
            </p>
          </div>
          <div className="bg-aluminum/10 p-4 rounded">
            <h3 className="font-sans text-[11px] uppercase tracking-[0.2em] text-aluminum mb-3">
              Master colore
            </h3>
            <p className="font-sans text-[11px] text-aluminum leading-relaxed">
              Costo master €/kg per colore, applicato con mix fisso 96/4 (MP
              / master). Colore neutro 10 €/kg, colorato 20 €/kg.
            </p>
          </div>
          <div className="bg-aluminum/10 p-4 rounded">
            <h3 className="font-sans text-[11px] uppercase tracking-[0.2em] text-aluminum mb-3">
              Imballo (€/pezzo)
            </h3>
            <p className="font-sans text-[11px] text-aluminum leading-relaxed">
              Costo fisso per pezzo, distinto per modalità (allineato /
              rinfusa) e fascia capacità (fino 125 ml / oltre 125 ml). Se
              vuoto, si usa il calcolo da pallettizzazione
              (imballo_items ÷ pezzi_pallet).
            </p>
          </div>
          <div className="bg-aluminum/10 p-4 rounded">
            <h3 className="font-sans text-[11px] uppercase tracking-[0.2em] text-aluminum mb-3">
              Fasi produzione
            </h3>
            <p className="font-sans text-[11px] text-aluminum leading-relaxed">
              Fase 1 attrezzaggio: ore uomo × costo orario. Fase 2 ciclo:
              velocità pz/h, costo orario macchina e RSU. Fase 3 imballo:
              RSU unità allineato (0,5) e rinfusa (0,25).
            </p>
          </div>
          <div className="bg-aluminum/10 p-4 rounded">
            <h3 className="font-sans text-[11px] uppercase tracking-[0.2em] text-aluminum mb-3">
              Ricarico vendite
            </h3>
            <p className="font-sans text-[11px] text-aluminum leading-relaxed">
              Applicato sul costo totale per fascia di quantità, con due regole
              possibili:<br/>
              • <strong>percentuale</strong>: prezzo = costo + costo × ricarico%<br/>
              • <strong>doppio80</strong>: prezzo = costo × 2 + (costo × 2 × 0,8)
              = costo × 3,6 (usata nelle prime fasce di quantità).<br/>
              Sfrido già incluso nel calcolo unitario.
            </p>
          </div>
        </div>
        <p className="mt-4 font-sans text-[10px] text-aluminum/60">
          I prezzi vengono ricalcolati automaticamente alla modifica di qualsiasi
          parametro: costi MP, master, imballo, fasi macchina o fasce di vendita.
        </p>
      </div>
    </div>
  )
}

function MachineParamsGrid({
  params,
  onChange,
  fields,
}: {
  params: Record<string, unknown> | null
  onChange: (v: Record<string, unknown>) => void
  fields?: [string, string][]
}) {
  const p: Record<string, unknown> = params ?? {}
  const fieldList: [string, string][] = fields ?? [
    ['ore_uomo', 'Ore uomo attrezzaggio'],
    ['costo_rsu', 'Costo ora uomo attrezzaggio'],
    ['velocita_pz_h', 'Velocità (pz/h)'],
    ['rsu_unit', 'RSU (unità)'],
                      ['costo_orario_rsu', 'Costo orario RSU'],
                      ['costo_orario_macchina', 'Costo orario macchina'],
    ['ricarico_costi_ind', 'Ricarico costi ind.'],
  ]
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
      {fieldList.map(([k, lbl]) => (
        <div key={k}>
          <label className="font-sans text-[10px] text-aluminum">{lbl}</label>
          <input
            type="number"
            step={0.01}
            value={Number(p[k]) || 0}
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
