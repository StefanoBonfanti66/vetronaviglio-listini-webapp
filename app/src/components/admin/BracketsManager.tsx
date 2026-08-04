import { useState } from 'react'
import type { PriceBracket } from '../../lib/types'
import {
  createBracket,
  deleteBracket,
  updateBracket,
} from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

const empty: Omit<PriceBracket, 'id'> = {
  sort_order: 1,
  da: 0,
  fino: 0,
  quantita_lotto: 0,
  sfrido: 0,
  ricarico_vendite: 0,
  regola_vendita: 'percentuale',
}

export default function BracketsManager({
  brackets,
  setBrackets,
}: {
  brackets: PriceBracket[]
  setBrackets: (updater: (prev: PriceBracket[]) => PriceBracket[]) => void
}) {
  const { session } = useAuth()
  const token = session?.access_token
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState<Omit<PriceBracket, 'id'>>(empty)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Omit<PriceBracket, 'id'>>(empty)
  const [msg, setMsg] = useState<string | null>(null)

  const notify = (m: string) => {
    setMsg(m)
    setTimeout(() => setMsg(null), 3000)
  }

  const num = (v: string, fallback = 0) => parseFloat(v) || fallback

  const numInput = (
    value: number,
    onChange: (v: number) => void,
    step = 1,
    w = 'w-20',
  ) => (
    <input
      type="number"
      step={step}
      value={value}
      onChange={(e) => onChange(num(e.target.value))}
      className={`${w} border border-aluminum/20 bg-white px-1.5 py-1 font-sans text-xs text-onyx focus:border-onyx focus:outline-none`}
    />
  )

  const label = 'block font-sans text-[10px] text-aluminum'

  const saveAdd = async () => {
    if (!token) return
    try {
      const created = await createBracket(token, draft)
      setBrackets((prev) => [...prev, created].sort((a, b) => a.sort_order - b.sort_order))
      notify('Fascia creata')
      setAdding(false)
      setDraft(empty)
    } catch (e) {
      notify('Errore: ' + String(e))
    }
  }

  const saveEdit = async () => {
    if (!token || !editingId) return
    try {
      const updated = await updateBracket(token, editingId, editDraft)
      setBrackets((prev) =>
        prev.map((b) => (b.id === editingId ? updated : b)).sort((a, b) => a.sort_order - b.sort_order),
      )
      notify('Fascia aggiornata')
      cancelEdit()
    } catch (e) {
      notify('Errore: ' + String(e))
    }
  }

  const startEdit = (b: PriceBracket) => {
    const { id: _id, ...rest } = b
    setEditingId(b.id)
    setEditDraft(rest)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditDraft(empty)
  }

  const confirmRemove = async (b: PriceBracket) => {
    if (!token) return
    if (!window.confirm(`Eliminare la fascia "Da ${b.da} – fino a ${b.fino}"?`)) return
    try {
      await deleteBracket(token, b.id)
      setBrackets((prev) => prev.filter((x) => x.id !== b.id))
      notify('Fascia eliminata')
    } catch (e) {
      notify('Errore: ' + String(e))
    }
  }

  const row = (b: PriceBracket, isEdit: boolean, d: Omit<PriceBracket, 'id'>, set: (v: Omit<PriceBracket, 'id'>) => void) => (
    <>
      <td className="px-3 py-2 text-onyx/80">{isEdit ? numInput(d.sort_order, (v) => set({ ...d, sort_order: v })) : b.sort_order}</td>
      <td className="px-3 py-2 text-onyx/80">{isEdit ? numInput(d.da, (v) => set({ ...d, da: v })) : b.da.toLocaleString('it-IT')}</td>
      <td className="px-3 py-2 text-onyx/80">{isEdit ? numInput(d.fino, (v) => set({ ...d, fino: v })) : b.fino.toLocaleString('it-IT')}</td>
      <td className="px-3 py-2 text-onyx/80">{isEdit ? numInput(d.quantita_lotto, (v) => set({ ...d, quantita_lotto: v })) : b.quantita_lotto.toLocaleString('it-IT')}</td>
      <td className="px-3 py-2 text-onyx/80">{isEdit ? numInput(d.sfrido, (v) => set({ ...d, sfrido: v }), 0.01, 'w-20') : b.sfrido}</td>
      <td className="px-3 py-2 text-onyx/80">{isEdit ? numInput(d.ricarico_vendite, (v) => set({ ...d, ricarico_vendite: v })) : `${b.ricarico_vendite}%`}</td>
      <td className="px-3 py-2 text-onyx/80">
        {isEdit ? (
          <select
            value={d.regola_vendita}
            onChange={(e) => set({ ...d, regola_vendita: e.target.value as PriceBracket['regola_vendita'] })}
            className="border border-aluminum/20 bg-white px-1 py-1 font-sans text-xs text-onyx focus:border-onyx focus:outline-none"
          >
            <option value="doppio80">doppio80</option>
            <option value="percentuale">percentuale</option>
          </select>
        ) : (
          b.regola_vendita
        )}
      </td>
    </>
  )

  return (
    <div className="bg-white border border-aluminum/10 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-xl font-semibold tracking-tight">Fasce di prezzo</h3>
          <p className="mt-1 font-sans text-[13px] text-aluminum">
            {brackets.length} fasce di quantità (sfrido, ricarico vendite, regola). Comuni a tutte le configurazioni.
          </p>
        </div>
        <button
          onClick={() => {
            setDraft(empty)
            setAdding(true)
          }}
          className="border border-onyx px-3 py-1.5 font-sans text-[10px] uppercase tracking-[0.2em] font-medium text-onyx hover:bg-onyx hover:text-bone transition-all duration-300"
        >
          Nuova fascia
        </button>
      </div>

      {msg && <p className="mt-3 border border-amber-accent/30 bg-surface p-3 text-sm text-onyx/80">{msg}</p>}

      {adding && (
        <div className="mt-4 border border-aluminum/20 p-3">
          <p className="mb-2 font-sans text-[10px] uppercase tracking-[0.2em] text-aluminum">Nuova fascia</p>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className={label}>Ordinamento</label>
              {numInput(draft.sort_order, (v) => setDraft({ ...draft, sort_order: v }))}
            </div>
            <div>
              <label className={label}>Da (pz)</label>
              {numInput(draft.da, (v) => setDraft({ ...draft, da: v }))}
            </div>
            <div>
              <label className={label}>Fino a (pz)</label>
              {numInput(draft.fino, (v) => setDraft({ ...draft, fino: v }))}
            </div>
            <div>
              <label className={label}>Quantità lotto</label>
              {numInput(draft.quantita_lotto, (v) => setDraft({ ...draft, quantita_lotto: v }))}
            </div>
            <div>
              <label className={label}>Sfrido</label>
              {numInput(draft.sfrido, (v) => setDraft({ ...draft, sfrido: v }), 0.01)}
            </div>
            <div>
              <label className={label}>Ricarico vendite %</label>
              {numInput(draft.ricarico_vendite, (v) => setDraft({ ...draft, ricarico_vendite: v }))}
            </div>
            <div>
              <label className={label}>Regola</label>
              <select
                value={draft.regola_vendita}
                onChange={(e) => setDraft({ ...draft, regola_vendita: e.target.value as PriceBracket['regola_vendita'] })}
                className="border border-aluminum/20 bg-white px-1 py-1 font-sans text-xs text-onyx focus:border-onyx focus:outline-none"
              >
                <option value="doppio80">doppio80</option>
                <option value="percentuale">percentuale</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setAdding(false); setDraft(empty) }}
                className="border border-aluminum/30 px-3 py-1 font-sans text-[10px] uppercase tracking-[0.2em] text-aluminum hover:border-onyx hover:text-onyx transition-all"
              >
                Annulla
              </button>
              <button
                onClick={saveAdd}
                className="bg-onyx px-3 py-1 font-sans text-[10px] uppercase tracking-[0.2em] font-medium text-bone hover:bg-aluminum transition-all"
              >
                Salva
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full font-sans text-xs min-w-[640px]">
          <thead>
            <tr className="border-b border-aluminum/10 text-left font-sans text-[10px] uppercase tracking-[0.15em] text-aluminum">
              <th className="px-3 py-2 font-medium">Ord</th>
              <th className="px-3 py-2 font-medium">Da</th>
              <th className="px-3 py-2 font-medium">Fino a</th>
              <th className="px-3 py-2 font-medium">Quantità lotto</th>
              <th className="px-3 py-2 font-medium">Sfrido</th>
              <th className="px-3 py-2 font-medium">Ricarico vendite</th>
              <th className="px-3 py-2 font-medium">Regola</th>
              <th className="px-3 py-2 font-medium">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {brackets.map((b) => (
              <tr key={b.id} className="border-b border-aluminum/10">
                {row(b, editingId === b.id, editDraft, setEditDraft)}
                <td className="px-3 py-2">
                  {editingId === b.id ? (
                    <span className="flex gap-2">
                      <button onClick={saveEdit} className="bg-onyx px-2 py-1 font-sans text-[10px] uppercase tracking-[0.2em] text-bone hover:bg-aluminum transition-all">Salva</button>
                      <button onClick={cancelEdit} className="border border-aluminum/30 px-2 py-1 font-sans text-[10px] uppercase tracking-[0.2em] text-aluminum hover:border-onyx hover:text-onyx transition-all">Annulla</button>
                    </span>
                  ) : (
                    <span className="flex gap-2">
                      <button onClick={() => startEdit(b)} className="border border-onyx px-2 py-1 font-sans text-[10px] uppercase tracking-[0.2em] text-onyx hover:bg-onyx hover:text-bone transition-all duration-300">Modifica</button>
                      <button onClick={() => confirmRemove(b)} className="border border-red-600/30 px-2 py-1 font-sans text-[10px] uppercase tracking-[0.2em] text-red-600 hover:bg-red-600 hover:text-bone transition-all">Elimina</button>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
