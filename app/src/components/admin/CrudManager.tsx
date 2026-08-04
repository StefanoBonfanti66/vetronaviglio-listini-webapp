import { useState } from 'react'
import type {
  Capacity,
  Color,
  Material,
} from '../../lib/types'
import { useAuth } from '../../context/AuthContext'

type Row = Material | Color | Capacity

interface Col<T extends Row> {
  key: keyof T & string
  label: string
  render?: (row: T) => string | number
}

interface Props<T extends Row> {
  title: string
  description: string
  cols: Col<T>[]
  rows: T[]
  setRows: (updater: (prev: T[]) => T[]) => void
  makeEmpty: () => Partial<T>
  create: (token: string, row: any) => Promise<T>
  update: (token: string, id: string, patch: any) => Promise<T>
  remove: (token: string, id: string) => Promise<void>
}

export default function CrudManager<T extends Row>({
  title,
  description,
  cols,
  rows,
  setRows,
  makeEmpty,
  create,
  update,
  remove,
}: Props<T>) {
  const { session } = useAuth()
  const token = session?.access_token
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState<Partial<T>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Partial<T>>({})
  const [msg, setMsg] = useState<string | null>(null)

  const notify = (m: string) => {
    setMsg(m)
    setTimeout(() => setMsg(null), 3000)
  }

  const isString = (v: unknown): v is string => typeof v === 'string'
  const fieldVal = (row: Partial<T>, c: Col<T>) => row[c.key] as string | number

  const startAdd = () => {
    setDraft(makeEmpty())
    setAdding(true)
  }

  const cancelAdd = () => {
    setAdding(false)
    setDraft({})
  }

  const saveAdd = async () => {
    if (!token) return
    try {
      const created = await create(token, draft)
      setRows((prev) => [...prev, created])
      notify('Elemento creato')
      cancelAdd()
    } catch (e) {
      notify('Errore: ' + String(e))
    }
  }

  const startEdit = (row: T) => {
    setEditingId(row.id)
    setEditDraft({ ...row })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditDraft({})
  }

  const saveEdit = async () => {
    if (!token || !editingId) return
    try {
      const updated = await update(token, editingId, editDraft)
      setRows((prev) => prev.map((r) => (r.id === editingId ? updated : r)))
      notify('Elemento aggiornato')
      cancelEdit()
    } catch (e) {
      notify('Errore: ' + String(e))
    }
  }

  const confirmRemove = async (row: T) => {
    if (!token) return
    const label = (row as any).name ?? (row as any).label ?? row.id
    if (!window.confirm(`Eliminare "${label}"? Le configurazioni collegate verranno rimosse.`)) return
    try {
      await remove(token, row.id)
      setRows((prev) => prev.filter((r) => r.id !== row.id))
      notify('Elemento eliminato')
    } catch (e) {
      notify('Errore: ' + String(e))
    }
  }

  const input = (c: Col<T>, row: Partial<T>, set: (v: Partial<T>) => void) => {
    if (c.key === 'enabled') {
      return (
        <input
          type="checkbox"
          checked={Boolean((row as any)[c.key])}
          onChange={(e) => set({ ...row, enabled: e.target.checked } as Partial<T>)}
          className="mt-1.5 h-4 w-4 accent-onyx"
        />
      )
    }
    const val = fieldVal(row, c)
    return (
      <input
        type={c.key === 'sort_order' || c.key === 'peso_disegno_g' ? 'number' : 'text'}
        value={val ?? ''}
        onChange={(e) =>
          set({
            ...row,
            [c.key]:
              c.key === 'sort_order' || c.key === 'peso_disegno_g'
                ? parseFloat(e.target.value) || 0
                : e.target.value,
          })
        }
        className="mt-0.5 w-full border border-aluminum/20 bg-white px-2 py-1 font-sans text-xs text-onyx focus:border-onyx focus:outline-none"
      />
    )
  }

  return (
    <div className="bg-white border border-aluminum/10 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-xl font-semibold tracking-tight">{title}</h3>
          <p className="mt-1 font-sans text-[13px] text-aluminum">{description}</p>
        </div>
        <button
          onClick={startAdd}
          className="border border-onyx px-3 py-1.5 font-sans text-[10px] uppercase tracking-[0.2em] font-medium text-onyx hover:bg-onyx hover:text-bone transition-all duration-300"
        >
          Nuovo
        </button>
      </div>

      {msg && (
        <p className="mt-3 border border-amber-accent/30 bg-surface p-3 text-sm text-onyx/80">{msg}</p>
      )}

      {adding && (
        <div className="mt-4 border border-aluminum/20 p-3">
          <p className="mb-2 font-sans text-[10px] uppercase tracking-[0.2em] text-aluminum">Nuovo elemento</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {cols.map((c) => (
              <div key={c.key}>
                <label className="block font-sans text-[10px] text-aluminum">{c.label}</label>
                {input(c, draft, setDraft)}
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={cancelAdd}
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
      )}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full font-sans text-xs">
          <thead>
            <tr className="border-b border-aluminum/10 text-left font-sans text-[10px] uppercase tracking-[0.15em] text-aluminum">
              {cols.map((c) => (
                <th key={c.key} className="px-3 py-2 font-medium">{c.label}</th>
              ))}
              <th className="px-3 py-2 font-medium">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-aluminum/10">
                {cols.map((c) => (
                  <td key={c.key} className="px-3 py-2 text-onyx/80">
                    {editingId === row.id ? (
                      input(c, editDraft, setEditDraft)
                    ) : c.key === 'enabled' ? (
                      <input
                        type="checkbox"
                        checked={Boolean((row as any)[c.key])}
                        onChange={async (e) => {
                          if (!token) return
                          try {
                            const updated = await update(token, row.id, { enabled: e.target.checked })
                            setRows((prev) => prev.map((r) => (r.id === row.id ? updated : r)))
                            notify(updated.enabled ? 'Elemento attivato' : 'Elemento disattivato')
                          } catch (err) {
                            notify('Errore: ' + String(err))
                          }
                        }}
                        className="h-4 w-4 accent-onyx"
                      />
                    ) : c.render ? (
                      c.render(row)
                    ) : isString(row[c.key]) ? (
                      String(row[c.key])
                    ) : (
                      fieldVal(row, c)
                    )}
                  </td>
                ))}
                <td className="px-3 py-2">
                  {editingId === row.id ? (
                    <span className="flex gap-2">
                      <button
                        onClick={saveEdit}
                        className="bg-onyx px-2 py-1 font-sans text-[10px] uppercase tracking-[0.2em] text-bone hover:bg-aluminum transition-all"
                      >
                        Salva
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="border border-aluminum/30 px-2 py-1 font-sans text-[10px] uppercase tracking-[0.2em] text-aluminum hover:border-onyx hover:text-onyx transition-all"
                      >
                        Annulla
                      </button>
                    </span>
                  ) : (
                    <span className="flex gap-2">
                      <button
                        onClick={() => startEdit(row)}
                        className="border border-onyx px-2 py-1 font-sans text-[10px] uppercase tracking-[0.2em] text-onyx hover:bg-onyx hover:text-bone transition-all duration-300"
                      >
                        Modifica
                      </button>
                      <button
                        onClick={() => confirmRemove(row)}
                        className="border border-red-600/30 px-2 py-1 font-sans text-[10px] uppercase tracking-[0.2em] text-red-600 hover:bg-red-600 hover:text-bone transition-all"
                      >
                        Elimina
                      </button>
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
