import { useEffect, useState } from 'react'
import type { FasciaImballo, ImballoFisso, ModalitaImballo } from '../../lib/types'
import { FASCE_IMBALLO, FASCIA_LABEL, MODALITA_IMBALLO, MODALITA_LABEL } from '../../lib/imballi'

type Props = {
  rows: ImballoFisso[]
  onSave: (
    modalita: ModalitaImballo,
    fascia: FasciaImballo,
    value: number | null,
  ) => Promise<void>
}

function key(modalita: ModalitaImballo, fascia: FasciaImballo): string {
  return `${modalita}:${fascia}`
}

export default function ImballiManager({ rows, onSave }: Props) {
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    const next: Record<string, string> = {}
    for (const modalita of MODALITA_IMBALLO) {
      for (const fascia of FASCE_IMBALLO) {
        const row = rows.find((r) => r.modalita === modalita && r.fascia === fascia)
        const v = row?.costo_eur_per_pezzo
        next[key(modalita, fascia)] = typeof v === 'number' ? String(v) : ''
      }
    }
    setDraft(next)
  }, [rows])

  const save = async () => {
    setBusy(true)
    setMsg(null)
    try {
      for (const modalita of MODALITA_IMBALLO) {
        for (const fascia of FASCE_IMBALLO) {
          const raw = (draft[key(modalita, fascia)] ?? '').trim()
          const value = raw === '' ? null : Number(raw)
          if (value !== null && (!Number.isFinite(value) || value < 0)) {
            throw new Error(`Valore non valido per ${MODALITA_LABEL[modalita]} / ${FASCIA_LABEL[fascia]}`)
          }
          const row = rows.find((r) => r.modalita === modalita && r.fascia === fascia)
          const current = row?.costo_eur_per_pezzo ?? null
          if (value === current) continue
          await onSave(modalita, fascia, value)
        }
      }
      setMsg('Costi imballi salvati')
    } catch (e) {
      setMsg(String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="border border-aluminum/20 bg-white p-4 md:p-6">
      <h2 className="font-display text-lg text-onyx">Costi imballi</h2>
      <p className="mt-1 font-sans text-xs text-aluminum">
        Costo imballo fisso in €/pezzo, da sommare ai costi diretti prima del ricarico vendite
        finale. Un valore per allineato e uno per rinfusa, distinti per fascia di capacità.
        Campo vuoto = non definito, in quel caso si usa il calcolo da pallettizzazione.
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {MODALITA_IMBALLO.map((modalita) => (
          <fieldset key={modalita} className="border border-aluminum/20 p-3">
            <legend className="px-1 font-sans text-[10px] uppercase tracking-[0.2em] font-medium text-aluminum">
              {MODALITA_LABEL[modalita]}
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {FASCE_IMBALLO.map((fascia) => (
                <div key={fascia}>
                  <label className="font-sans text-[10px] text-aluminum">
                    {FASCIA_LABEL[fascia]} (€/pezzo)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    placeholder="—"
                    value={draft[key(modalita, fascia)] ?? ''}
                    onChange={(e) =>
                      setDraft({ ...draft, [key(modalita, fascia)]: e.target.value })
                    }
                    className="mt-0.5 w-full border border-aluminum/20 bg-white px-1.5 py-1 font-sans text-xs text-onyx focus:border-onyx focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={save}
          disabled={busy}
          className="bg-onyx text-bone px-4 py-2 font-sans text-[10px] uppercase tracking-[0.2em] font-medium hover:bg-aluminum transition-all disabled:opacity-50"
        >
          Salva costi imballi
        </button>
        {msg && <span className="font-sans text-xs text-aluminum">{msg}</span>}
      </div>
    </div>
  )
}
