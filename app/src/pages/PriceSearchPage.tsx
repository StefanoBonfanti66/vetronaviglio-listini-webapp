import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  getCapacities,
  getColors,
  getConfig,
  getMaterials,
  getPriceBrackets,
} from '../lib/api'
import { calcBracket } from '../lib/pricing'
import type {
  Capacity,
  Color,
  ListinoConfig,
  Material,
  PriceBracket,
} from '../lib/types'
import type { BracketResult } from '../lib/pricing'

function euro(x: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(x)
}

export default function PriceSearchPage() {
  const { profile, signOut, session } = useAuth()
  const accessToken = session?.access_token
  const [materials, setMaterials] = useState<Material[]>([])
  const [colors, setColors] = useState<Color[]>([])
  const [capacities, setCapacities] = useState<Capacity[]>([])
  const [brackets, setBrackets] = useState<PriceBracket[]>([])

  const [materialId, setMaterialId] = useState('')
  const [colorId, setColorId] = useState('')
  const [capacityId, setCapacityId] = useState('')
  const [config, setConfig] = useState<ListinoConfig | null>(null)
  const [configError, setConfigError] = useState<string | null>(null)

  useEffect(() => {
    if (!accessToken) return
    Promise.all([
      getMaterials(accessToken),
      getColors(accessToken),
      getCapacities(accessToken),
      getPriceBrackets(accessToken),
    ])
      .then(([m, c, ca, b]) => {
        setMaterials(m)
        setColors(c)
        setCapacities(ca)
        setBrackets(b)
        if (m.length > 0) setMaterialId(m[0].id)
        if (c.length > 0) setColorId(c[0].id)
        if (ca.length > 0) setCapacityId(ca[0].id)
      })
      .catch((e) => setConfigError(String(e)))
  }, [accessToken])

  useEffect(() => {
    if (!accessToken || !materialId || !colorId || !capacityId) {
      setConfig(null)
      return
    }
    let cancelled = false
    getConfig(accessToken, capacityId, materialId, colorId)
      .then((cfg) => {
        if (!cancelled) {
          setConfig(cfg)
          setConfigError(
            cfg ? null : 'Nessun listino configurato per questa combinazione',
          )
        }
      })
      .catch((e) => {
        if (!cancelled) setConfigError(String(e))
      })
    return () => {
      cancelled = true
    }
  }, [accessToken, materialId, colorId, capacityId])

  const results: BracketResult[] = useMemo(() => {
    if (!config) return []
    return brackets
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((b) =>
        calcBracket(
          {
            peso_disegno_g: config.peso_disegno_g,
            mp_costos_kg: config.mp_costos_kg,
            mp_utilizzi_pct: config.mp_utilizzi_pct,
            imballo_items: config.imballo_items,
            pezzi_pallet: config.pezzi_pallet,
            allineato: config.allineato,
            rinfusa: config.rinfusa,
            rinfusaRicaricoDiv100: config.rinfusa_ricarico_div_100,
          },
          {
            sort_order: b.sort_order,
            quantita_lotto: b.quantita_lotto,
            sfrido: b.sfrido,
            ricarico_vendite: b.ricarico_vendite,
            regola_vendita: b.regola_vendita,
          },
        ),
      )
  }, [config, brackets])

  const bracketMeta = useMemo(
    () => new Map(brackets.map((b) => [b.sort_order, b])),
    [brackets],
  )

  const materialName = useMemo(
    () => materials.find((m) => m.id === materialId)?.name ?? '',
    [materials, materialId],
  )
  const colorName = useMemo(
    () => colors.find((c) => c.id === colorId)?.name ?? '',
    [colors, colorId],
  )
  const capacityLabel = useMemo(
    () => capacities.find((c) => c.id === capacityId)?.label ?? '',
    [capacities, capacityId],
  )

  const handlePrint = () => {
    window.print()
  }

  const selectCls =
    'mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none'

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-bold text-slate-800">Listino Vetronaviglio</h1>
            <p className="text-xs text-slate-500">
              {materialName} · {colorName} · {capacityLabel} ml
            </p>
          </div>
          <div className="flex items-center gap-3">
            {profile && (
              <span className="text-xs text-slate-500">
                {profile.full_name ?? 'Utente'} ({profile.role})
              </span>
            )}
            {profile?.role === 'admin' && (
              <Link
                to="/admin"
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Gestione dati
              </Link>
            )}
            <button
              onClick={signOut}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Esci
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-slate-700">Materiale</label>
            <select
              value={materialId}
              onChange={(e) => setMaterialId(e.target.value)}
              className={selectCls}
            >
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Colore</label>
            <select
              value={colorId}
              onChange={(e) => setColorId(e.target.value)}
              className={selectCls}
            >
              {colors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Capacità (ml)
            </label>
            <select
              value={capacityId}
              onChange={(e) => setCapacityId(e.target.value)}
              className={selectCls}
            >
              {capacities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {configError && !config && (
          <p className="mt-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
            {configError}
          </p>
        )}

        {config && (
          <>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-2 print:hidden">
              <h2 className="text-base font-semibold text-slate-800">
                Prezzi di vendita — {capacityLabel} ml · {materialName} · {colorName}
              </h2>
              <button
                onClick={handlePrint}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Stampa / PDF
              </button>
            </div>

            <div className="mt-3 overflow-x-auto rounded-xl bg-white shadow">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-500">
                    <th className="px-3 py-2">Fascia</th>
                    <th className="px-3 py-2">Quantità</th>
                    <th className="px-3 py-2">Prezzo allineato</th>
                    <th className="px-3 py-2">Prezzo rinfusa</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => {
                    const meta = bracketMeta.get(r.bracket.sort_order)
                    return (
                      <tr key={r.bracket.sort_order} className="border-b border-slate-100">
                        <td className="px-3 py-2 text-slate-500">
                          {(meta?.da ?? 0).toLocaleString('it-IT')} –{' '}
                          {(meta?.fino ?? 0).toLocaleString('it-IT')}
                        </td>
                        <td className="px-3 py-2 font-medium text-slate-700">
                          {r.bracket.quantita_lotto.toLocaleString('it-IT')}
                        </td>
                        <td className="px-3 py-2 font-semibold text-slate-800">
                          {euro(r.allineato.prezzoVendita)}
                        </td>
                        <td className="px-3 py-2 font-semibold text-slate-800">
                          {euro(r.rinfusa.prezzoVendita)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <BreakdownCard title="Allineato — ultima fascia" result={results[results.length - 1]} side="allineato" />
              <BreakdownCard title="Rinfusa — ultima fascia" result={results[results.length - 1]} side="rinfusa" />
            </div>
          </>
        )}
      </main>
    </div>
  )
}

function BreakdownCard({
  title,
  result,
  side,
}: {
  title: string
  result: BracketResult | undefined
  side: 'allineato' | 'rinfusa'
}) {
  if (!result) return null
  const a = result.allineato
  const r = result.rinfusa
  const d = side === 'allineato' ? a : r
  return (
    <div className="rounded-xl bg-white p-4 shadow">
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      <dl className="mt-2 space-y-1 text-xs">
        <Row label="Peso con sfrido (g)" value={`${a.pesoConSfrido} g`} />
        <Row label="Costo materia prima" value={euro(a.costoMateriaPrima)} />
        <Row label="Costo imballo" value={euro(a.costoImballo)} />
        <Row label="Attrezzaggio" value={euro(a.costoAttrezzaggio)} />
        <Row
          label="Uomo + macchina"
          value={euro(side === 'allineato' ? a.costoUomoMacchina : r.costoUomoMacchina)}
        />
        <Row label="Totale costo" value={euro(d.totaleCosto)} />
        <Row
          label="Totale con ricarico ind."
          value={euro(d.totaleConRicaricoInd)}
        />
        <Row label="Costo unitario" value={euro(d.costoUnitario)} />
        <Row label="Prezzo di vendita" value={euro(d.prezzoVendita)} strong />
      </dl>
    </div>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between border-b border-slate-50 py-1">
      <dt className="text-slate-500">{label}</dt>
      <dd className={strong ? 'font-bold text-slate-800' : 'text-slate-700'}>{value}</dd>
    </div>
  )
}
